import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

export interface LivePrice {
  id: string;
  ticker: string;
  price: number;
  changePercent: number;
  name: string;
}

interface LivePriceContextValue {
  prices: Map<string, LivePrice>;
  connected: boolean;
  lastUpdate: number | null;
}

const LivePriceContext = createContext<LivePriceContextValue>({
  prices: new Map(),
  connected: false,
  lastUpdate: null,
});

export function useLivePrices() {
  return useContext(LivePriceContext);
}

export function LivePriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (mountedRef.current) setConnected(true);
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'live_prices') {
              const priceMap = new Map<string, LivePrice>();
              (message.prices as LivePrice[]).forEach((p) => {
                priceMap.set(p.id, p);
              });
              setPrices(priceMap);
              setLastUpdate(message.timestamp || Date.now());
            } else if (message.type === 'pong') {
              // connection healthy
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (mountedRef.current) {
            setConnected(false);
            reconnectTimerRef.current = setTimeout(connect, 5000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimerRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <LivePriceContext.Provider value={{ prices, connected, lastUpdate }}>
      {children}
    </LivePriceContext.Provider>
  );
}
