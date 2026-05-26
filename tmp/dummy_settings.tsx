      {/* SECTION 4.5: SGT COMMUNITY DIRECTORY & PRIVACY SETTINGS */}
      <div id="sgt-community-privacy-section" className="rounded-2xl border border-zinc-800 bg-[#0C0C0E] bg-radial from-[#120e09] to-[#0C0C0E] p-6 lg:p-8 text-left space-y-8 relative overflow-hidden">
        {/* Ambient header glow */}
        <div className="absolute top-0 right-[25%] w-72 h-72 bg-[#FE8C00]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-[10%] w-60 h-60 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* Header Title Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900/60 pb-5">
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest font-bold text-[#FE8C00] uppercase">
              <Users className="h-3.5 w-3.5 text-[#FE8C00] animate-pulse" />
              Sovereign Trading Network
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white">
              SGT Community Directory
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Meet peer strategists on the platform. Review active profiles, and manage your private or public visibility on our directory listings.
            </p>
          </div>
        </div>

        {/* Main Bento Partition: Left (Directory) & Right (Your settings and Auth entry) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Column: Community Directory (3 Grid Wide) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h4 className="text-xs font-mono font-black text-neutral-400 uppercase tracking-widest">
                Active Strategist Index
              </h4>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                ● Live synchronized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1 select-none hide-scrollbar">
              {members.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-zinc-650 font-mono italic">
                  Indexing network nodes... Loading community register...
                </div>
              ) : (
                members.map((m) => {
                  const isVisible = m.isPublic !== false;
                  
                  if (!isVisible) {
                    return (
                      <div 
                        key={m.uid || m.email}
                        className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between h-[155px] relative overflow-hidden group/anon"
                      >
                        <div className="absolute inset-0 bg-radial from-[#120a07]/5 to-transparent opacity-0 group-hover/anon:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex items-start gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-zinc-500 tracking-wider">🔒 ANON STRATEGIST</span>
                            <span className="text-[9px] font-mono block text-[#FE8C00]/40 uppercase tracking-widest leading-none font-bold">Visibility: Private</span>
                          </div>
                        </div>
                        <p className="text-[10.5px] italic text-zinc-600 mt-2.5 line-clamp-2 leading-relaxed">
                          Profile is private. Biometric security layers and disclosure credentials applied by the user.
                        </p>
                        <div className="text-[9.5px] font-mono font-bold text-zinc-700 uppercase pt-2 border-t border-zinc-900/40">
                          ID: {m.uid?.substring(0, 10)}... ★ SGT Verified
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={m.uid || m.email}
                      className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/15 hover:border-[#FE8C00]/30 hover:bg-zinc-900/5 transition-all flex flex-col justify-between h-[155px] group/mem"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-display text-xs font-black border ${m.avatarColor || "bg-zinc-900 text-zinc-400 border-zinc-800"}`}>
                              {m.displayName?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-black text-white group-hover/mem:text-[#FE8C00] transition-colors block tracking-wide">{m.displayName}</span>
                              <span className="text-[8.5px] font-mono block text-emerald-400 uppercase tracking-wider leading-none font-black">{m.badge || "SGT Scholar"}</span>
                            </div>
                          </div>
                          
                          <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-1 py-0.5 rounded leading-none uppercase font-black tracking-wider">
                            Public
                          </span>
                        </div>
                        
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed font-semibold mt-2.5 line-clamp-3">
                          {m.bio || "This macro-strategist has not supplied a custom biometric signature line yet."}
                        </p>
                      </div>

                      <div className="text-[9.5px] font-mono font-bold text-zinc-500 uppercase pt-2 border-t border-zinc-900/40 flex items-center justify-between">
                        <span>★ SGT MEMBER</span>
                        <span className="text-neutral-600">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Joined'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Settings Card / Auth Portal Entry (2 Grid Wide) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h4 className="text-xs font-mono font-black text-neutral-400 uppercase tracking-widest">
                Account & Settings Node
              </h4>
            </div>

            {/* Logical Auth toggle card */}
            {!user ? (
              /* GUEST STATE: Dynamic login portal redirect card */
              <div className="p-5 rounded-xl border border-dashed border-zinc-800 bg-[#0C0C0E]/45 space-y-4 text-center py-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FE8C00]/5 blur-xl rounded-full" />
                
                <div className="h-10 w-10 rounded-full bg-zinc-900/80 border border-zinc-850 flex items-center justify-center text-zinc-500 group-hover:text-[#FE8C00] transition-colors mx-auto">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                
                <div className="space-y-1.5 max-w-xs mx-auto">
                  <h5 className="text-xs font-mono font-black text-white uppercase tracking-widest">Sovereign Intel Gate</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                    Sign in or sign up above to register your profile. Controls allow toggling your bio visibility, custom user handles, and database index.
                  </p>
                </div>

                <div className="space-y-2 pt-3">
                  <button
                    onClick={onOpenAuthModal}
                    className="w-full justify-center flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FE8C00] to-[#FF930F] text-zinc-950 font-black text-xs py-3.5 px-4 shadow-lg shadow-[#FE8C00]/10 hover:brightness-105 cursor-pointer transform hover:-translate-y-0.5 transition-all"
                  >
                    <LogIn className="h-4 w-4 text-zinc-950" />
                    Connect Community Credentials
                  </button>
                  <p className="text-[8.5px] font-mono text-zinc-500 uppercase font-black uppercase tracking-widest">
                    Authorized security gate using standard crypto-auth keys
                  </p>
                </div>
              </div>
            ) : (
              /* AUTHORIZED STATE: Live Profile and privacy settings form togglers */
              <div className="p-5 rounded-xl border border-zinc-900 bg-zinc-950/30 space-y-4.5 text-left">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-900/55">
                  <img
                    src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop"}
                    alt="user profile"
                    className="h-9 w-9 rounded-lg border border-[#FE8C00]/40 shrink-0"
                  />
                  <div>
                    <h5 className="text-xs font-black text-white tracking-wide">{user.displayName}</h5>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold">{user.email}</span>
                  </div>
                </div>

                {/* Privacy Visibility Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">DIRECTORY VISIBILITY STATUS</label>
                  <button
                    onClick={() => setIsProfilePublic(!isProfilePublic)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                      isProfilePublic 
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/15 text-rose-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left">
                      {isProfilePublic ? (
                        <>
                          <Globe className="h-4 w-4 text-emerald-400 shrink-0 animate-spin-slow" />
                          <div>
                            <p className="text-[11px] font-black leading-none uppercase tracking-wide">Public Intel Profile</p>
                            <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5 font-semibold">Listed in SGT active indices.</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-rose-400 shrink-0" />
                          <div>
                            <p className="text-[11px] font-black leading-none uppercase tracking-wide">Private Ledger Profile</p>
                            <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5 font-semibold">Strictly private; blurred directory node.</span>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Biography settings field block */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">YOUR INVESTOR THESIS / BIO (MAX 140 CHR)</label>
                  <textarea
                    maxLength={140}
                    rows={3}
                    placeholder="E.g., Accumulating Nvidia equities, gold reserves, and trailing indices."
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-zinc-900 bg-[#0C0C0E] text-white outline-none focus:border-[#FE8C00] transition-colors resize-none placeholder-zinc-500 font-semibold"
                  />
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>Double-vet active nodes on change</span>
                    <span>{editedBio.length}/140</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingSettings}
                  className="w-full justify-center flex items-center gap-2 rounded-xl bg-zinc-90 w-full justify-center flex items-center gap-2 bg-gradient-to-r from-[#FE8C00] to-[#FF930F] text-zinc-950 font-black text-xs py-3 px-4 shadow hover:brightness-105 cursor-pointer disabled:opacity-50 transition-all transform active:scale-[0.98]"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingSettings ? "Updating Credentials..." : "Commit Privacy Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
