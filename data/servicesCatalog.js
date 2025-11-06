// /data/servicesCatalog.js
export const SERVICE_CATALOG = [
  {
    id: "engine",
    name: "Motor",
    children: [
      { id: "engine.service", name: "Motorservice" },
      { id: "engine.oil_filter", name: "Olie- og filterskift" },
      { id: "engine.troubleshoot", name: "Fejlsøgning & reparation" },
      { id: "engine.cooling", name: "Køling / impeller" },
    ],
  },
  {
    id: "hull",
    name: "Skrog",
    children: [
      { id: "hull.antifoul", name: "Bundmaling" },
      { id: "hull.polish", name: "Polering & voks" },
      { id: "hull.repair", name: "Reparation af skrog" },
    ],
  },
  {
    id: "electrical",
    name: "El",
    children: [
      { id: "electrical.install", name: "Installation" },
      { id: "electrical.troubleshoot", name: "Fejlsøgning" },
      { id: "electrical.battery", name: "Batterier & ladning" },
      { id: "electrical.lights", name: "Navigation-/lanterner" },
    ],
  },
  {
    id: "rigging",
    name: "Rig & sejl",
    children: [
      { id: "rigging.service", name: "Riggerservice" },
      { id: "rigging.sails", name: "Reparation af sejl" },
      { id: "rigging.mast", name: "Mast & vant" },
    ],
  },
  {
    id: "winter",
    name: "Vinteropbevaring",
    children: [
      { id: "winter.layup", name: "Klargøring til vinter" },
      { id: "winter.commission", name: "Ibrugtagning forår" },
      { id: "winter.storage", name: "Opbevaring" },
    ],
  },
  {
    id: "plumbing",
    name: "Vand & gas",
    children: [
      { id: "plumbing.fresh", name: "Ferskvandssystem" },
      { id: "plumbing.waste", name: "Toilet/holding tank" },
      { id: "plumbing.gas", name: "Gasinstallation" },
    ],
  },
  {
    id: "nav",
    name: "Elektronik",
    children: [
      { id: "nav.install", name: "Plotter/ekkolod/autopilot" },
      { id: "nav.network", name: "NMEA/Netværk" },
    ],
  },
  {
    id: "cleaning",
    name: "Rengøring & klargøring",
    children: [
      { id: "cleaning.interior", name: "Indvendig rengøring" },
      { id: "cleaning.exterior", name: "Udvendig vask" },
      { id: "cleaning.polish", name: "Polering (let)" },
    ],
  },
  {
    id: "misc",
    name: "Diverse",
    children: [
      { id: "misc.transport", name: "Transport / søsætning" },
      { id: "misc.repair", name: "Reparationer (andet)" },
      { id: "misc.survey", name: "Syn/inspektion" },
    ],
  },
];
