// Launch monetization configuration.
// Keep enabled=false until the custom domain is live and AdSense has supplied the real IDs.
export const AD_CONFIG=Object.freeze({
  enabled:false,
  provider:'adsense',
  client:'', // ca-pub-################
  slots:Object.freeze({
    result:'', // responsive unit shown after a completed battle report
    footer:''  // responsive unit shown at the bottom of a planner view
  })
});

export function validAdSenseClient(value){return /^ca-pub-\d{16}$/.test(String(value||''));}
export function validAdSenseSlot(value){return /^\d{6,20}$/.test(String(value||''));}
export function adsReady(config=AD_CONFIG){return !!config.enabled&&validAdSenseClient(config.client)&&Object.values(config.slots||{}).some(validAdSenseSlot);}
