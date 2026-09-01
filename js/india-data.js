/**
 * HeatWatch - All-India Industrial Infrastructure & Thermal Catalog
 * Comprehensive database covering 50+ major industrial and environmental complexes
 * across India with coordinates, facility polygons, capacities, and baseline profiles.
 */

export const ALL_INDIA_FACILITIES = [
  // ==========================================
  // 1. REFINERIES & PETROCHEMICAL COMPLEXES
  // ==========================================
  {
    id: "REF-01",
    name: "Jamnagar Mega-Refinery & Cracker (RIL)",
    state: "Gujarat",
    city: "Moti Khavdi, Jamnagar",
    type: "Petrochemical & Refinery",
    coordinates: [22.3481, 69.8596],  // Wikipedia: 22°20'53"N 69°51'35"E (Global Energy Observatory verified)
    capacity: "1.24 Million BPD (68.2 MMTPA)",
    baselineFRP: 42.0,
    currentFRP: 68.4,
    status: "high_priority",
    operator: "Reliance Industries Ltd",
    units: "Crude Distillation, FCCU, Polypropylene Cracker, 8 Flare Stacks",
    landCover: { industrialBuiltUp: 76.4, bareSoilPaved: 15.2, waterBody: 5.1, vegetationTree: 3.3, cropland: 0.0 }
  },
  {
    id: "REF-02",
    name: "Nayara Energy Vadinar Refinery",
    state: "Gujarat",
    city: "Devbhumi Dwarka / Vadinar",
    type: "Petrochemical & Refinery",
    coordinates: [22.4160, 69.7380],  // GEM.wiki: Nayara Vadinar refinery centroid
    capacity: "20 MMTPA (400,000 BPD)",
    status: "inactive",
    operator: "Nayara Energy (Rosneft JV)",
    units: "Delayed Coker, Hydrocracker, Sulfur Recovery, 4 Flares",
    landCover: { industrialBuiltUp: 71.0, bareSoilPaved: 22.0, waterBody: 5.0, vegetationTree: 2.0, cropland: 0.0 }
  },
  {
    id: "REF-03",
    name: "IOCL Panipat Refinery & Petrochemical Complex",
    state: "Haryana",
    city: "Panipat",
    type: "Petrochemical & Refinery",
    coordinates: [29.4800, 76.8790],  // IOCL official: 29°28'48"N 76°52'44"E
    capacity: "15 MMTPA (Expanding to 25 MMTPA)",
    status: "inactive",
    operator: "Indian Oil Corporation Ltd",
    units: "Naphtha Cracker, PTA Plant, PX Unit, Purified Terephthalic Acid",
    landCover: { industrialBuiltUp: 68.0, cropland: 24.0, bareSoilPaved: 6.0, vegetationTree: 2.0, waterBody: 0.0 }
  },
  {
    id: "REF-04",
    name: "IOCL Mathura Refinery",
    state: "Uttar Pradesh",
    city: "Mathura",
    type: "Petrochemical & Refinery",
    coordinates: [27.3783, 77.6864],  // Wikipedia/MapCarta: 27°22'42"N 77°41'11"E — Baad village refinery (NOT Mathura city)
    capacity: "8.0 MMTPA",
    status: "inactive",
    operator: "Indian Oil Corporation Ltd",
    units: "FCCU, Diesel Hydro-treating, Sulfur Plant (TTZ Sensitive Zone)",
    landCover: { industrialBuiltUp: 62.0, cropland: 30.0, bareSoilPaved: 5.0, vegetationTree: 3.0, waterBody: 0.0 }
  },
  {
    id: "REF-05",
    name: "BPCL Mumbai Refinery (Mahul)",
    state: "Maharashtra",
    city: "Mumbai (Chembur/Mahul)",
    type: "Petrochemical & Refinery",
    coordinates: [19.0125, 72.8945],
    capacity: "12.0 MMTPA",
    status: "inactive",
    operator: "Bharat Petroleum Corporation Ltd",
    units: "Hydrocracker, Catalytic Reformer, High-Density Urban Buffer",
    landCover: { industrialBuiltUp: 84.0, waterBody: 12.0, bareSoilPaved: 4.0, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "REF-06",
    name: "HPCL Mumbai Refinery",
    state: "Maharashtra",
    city: "Mumbai (Mahul)",
    type: "Petrochemical & Refinery",
    coordinates: [19.0055, 72.8990],
    capacity: "9.5 MMTPA",
    status: "inactive",
    operator: "Hindustan Petroleum Corporation Ltd",
    units: "Lube Base Oil Refinery, FCCU, Catalytic Cracking",
    landCover: { industrialBuiltUp: 86.0, waterBody: 10.0, bareSoilPaved: 4.0, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "REF-07",
    name: "BPCL Kochi Refinery (Ambalamugal)",
    state: "Kerala",
    city: "Kochi",
    type: "Petrochemical & Refinery",
    coordinates: [9.9745, 76.3655],
    capacity: "15.5 MMTPA",
    status: "inactive",
    operator: "Bharat Petroleum Corporation Ltd",
    units: "Integrated Refinery Expansion Complex (IREP), Propylene Derivatives",
    landCover: { industrialBuiltUp: 65.0, vegetationTree: 25.0, waterBody: 8.0, bareSoilPaved: 2.0, cropland: 0.0 }
  },
  {
    id: "REF-08",
    name: "IOCL Paradip Mega-Refinery",
    state: "Odisha",
    city: "Paradip",
    type: "Petrochemical & Refinery",
    coordinates: [20.2487, 86.5995],  // Wikipedia/IOCL: 20°14'55"N 86°35'58"E — Jhimani village, 5km SW of Paradip Port
    capacity: "15.0 MMTPA",
    status: "inactive",
    operator: "Indian Oil Corporation Ltd",
    units: "INDMAX FCCU, Polypropylene, Dual Feed Cracker Complex",
    landCover: { industrialBuiltUp: 70.0, waterBody: 18.0, bareSoilPaved: 8.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "REF-09",
    name: "IOCL Haldia Refinery & Petrochemicals",
    state: "West Bengal",
    city: "Haldia",
    type: "Petrochemical & Refinery",
    coordinates: [22.0300, 88.0680],  // OSM: 22°01'48"N 88°04'05"E — Haldia refinery
    capacity: "8.0 MMTPA",
    status: "inactive",
    operator: "Indian Oil Corporation Ltd / Haldia Petrochemicals",
    units: "Naphtha Cracker, Polymer Plants, Lube Oil Block, Port Terminal",
    landCover: { industrialBuiltUp: 74.0, waterBody: 16.0, bareSoilPaved: 6.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "REF-10",
    name: "HPCL Visakhapatnam Refinery",
    state: "Andhra Pradesh",
    city: "Visakhapatnam",
    type: "Petrochemical & Refinery",
    coordinates: [17.6925, 83.2625],
    capacity: "15.0 MMTPA (Visakh Refinery Modernisation)",
    status: "inactive",
    operator: "Hindustan Petroleum Corporation Ltd",
    units: "Residue Upgradation Facility, Hydrogen Generation Units",
    landCover: { industrialBuiltUp: 78.0, waterBody: 12.0, bareSoilPaved: 6.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "REF-11",
    name: "HMEL Guru Gobind Singh Refinery (Bathinda)",
    state: "Punjab",
    city: "Bathinda",
    type: "Petrochemical & Refinery",
    coordinates: [30.1180, 74.8950],  // HMEL official: 30°07'04"N 74°53'42"E — Guru Gobind Singh Refinery Bathinda
    capacity: "11.3 MMTPA",
    status: "inactive",
    operator: "HPCL-Mittal Energy Ltd (HMEL)",
    units: "Dual Feed Polypropylene & Polyethylene Complex",
    landCover: { industrialBuiltUp: 64.0, cropland: 30.0, bareSoilPaved: 6.0, vegetationTree: 0.0, waterBody: 0.0 }
  },
  {
    id: "REF-12",
    name: "CPCL Manali Refinery (Chennai)",
    state: "Tamil Nadu",
    city: "Chennai (Manali)",
    type: "Petrochemical & Refinery",
    coordinates: [13.1670, 80.2820],  // OSM: 13°10'01"N 80°16'55"E — Manali, Chennai
    capacity: "10.5 MMTPA",
    status: "inactive",
    operator: "Chennai Petroleum Corporation Ltd",
    units: "FCCU, Lube Plants, High Heavy Crude Processing",
    landCover: { industrialBuiltUp: 80.0, waterBody: 10.0, bareSoilPaved: 6.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "REF-13",
    name: "BPCL Bina Refinery",
    state: "Madhya Pradesh",
    city: "Bina (Sagar)",
    type: "Petrochemical & Refinery",
    coordinates: [24.1300, 78.1570],  // Wikipedia: 24°07'48"N 78°09'25"E — BPCL Bina Refinery near Bina town
    capacity: "7.8 MMTPA",
    status: "inactive",
    operator: "Bharat Petroleum Corporation Ltd",
    units: "Delayed Coker, Hydrocracker, Central India Distribution Hub",
    landCover: { industrialBuiltUp: 60.0, cropland: 32.0, bareSoilPaved: 6.0, vegetationTree: 2.0, waterBody: 0.0 }
  },
  {
    id: "REF-14",
    name: "IOCL Barauni Refinery",
    state: "Bihar",
    city: "Begusarai / Barauni",
    type: "Petrochemical & Refinery",
    coordinates: [25.4580, 85.9940],  // OSM: 25°27'29"N 85°59'38"E — Barauni, Begusarai
    capacity: "6.0 MMTPA",
    status: "inactive",
    operator: "Indian Oil Corporation Ltd",
    units: "Atmospheric Distillation, Coking, Bitumen Units",
    landCover: { industrialBuiltUp: 58.0, cropland: 35.0, bareSoilPaved: 5.0, vegetationTree: 2.0, waterBody: 0.0 }
  },
  {
    id: "REF-15",
    name: "Numaligarh Refinery (Assam)",
    state: "Assam",
    city: "Golaghat / Numaligarh",
    type: "Petrochemical & Refinery",
    coordinates: [26.5530, 93.6740],  // NRL official: 26°33'11"N 93°40'26"E — Numaligarh, Golaghat
    capacity: "3.0 MMTPA (Expanding to 9 MMTPA)",
    status: "inactive",
    operator: "Numaligarh Refinery Ltd (NRL)",
    units: "Wax Plant, Hydrocracker, Kaziranga Buffer Proximity Monitoring",
    landCover: { industrialBuiltUp: 52.0, vegetationTree: 38.0, cropland: 6.0, waterBody: 4.0, bareSoilPaved: 0.0 }
  },

  // ==========================================
  // 2. SUPER THERMAL POWER STATIONS (COAL & GAS)
  // ==========================================
  {
    id: "PWR-01",
    name: "NTPC Vindhyachal Super Thermal Power Station",
    state: "Madhya Pradesh",
    city: "Singrauli / Vindhyanagar",
    type: "Thermal Power Station",
    coordinates: [24.0972, 82.6736],  // Wikipedia: 24°05'50"N 82°40'25"E — Vindhyanagar STPS
    capacity: "4,760 MW (Largest Coal Plant in India)",
    status: "inactive",
    operator: "NTPC Limited",
    units: "13 Coal Generating Units (6x210MW + 7x500MW), Ash Dykes",
    landCover: { industrialBuiltUp: 72.0, bareSoilPaved: 18.0, waterBody: 6.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "PWR-02",
    name: "NTPC Korba Super Thermal Power Station",
    state: "Chhattisgarh",
    city: "Korba",
    type: "Thermal Power Station",
    coordinates: [22.3878, 82.6838],  // GlobalEnergyObservatory: NTPC Korba STPS, Jamanipali
    capacity: "2,600 MW",
    status: "inactive",
    operator: "NTPC Limited",
    units: "7 Units (3x200MW + 4x500MW), Coal Conveyor & Ash Basin",
    landCover: { industrialBuiltUp: 68.2, bareSoilPaved: 18.3, vegetationTree: 9.1, waterBody: 4.4, cropland: 0.0 }
  },
  {
    id: "PWR-03",
    name: "NTPC Singrauli Super Thermal Power Station (Shaktinagar)",
    state: "Uttar Pradesh",
    city: "Sonbhadra / Shaktinagar",
    type: "Thermal Power Station",
    coordinates: [24.1085, 82.7825],
    capacity: "2,000 MW",
    status: "inactive",
    operator: "NTPC Limited",
    units: "5x200MW + 2x500MW, Rihand Reservoir Intake",
    landCover: { industrialBuiltUp: 66.0, waterBody: 20.0, bareSoilPaved: 10.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "PWR-04",
    name: "NTPC Sipat Super Thermal Power Station",
    state: "Chhattisgarh",
    city: "Bilaspur / Sipat",
    type: "Thermal Power Station",
    coordinates: [22.1385, 82.2925],
    capacity: "2,980 MW",
    status: "inactive",
    operator: "NTPC Limited",
    units: "Supercritical Boiler Technology (3x660MW + 2x500MW)",
    landCover: { industrialBuiltUp: 64.0, cropland: 26.0, bareSoilPaved: 6.0, vegetationTree: 4.0, waterBody: 0.0 }
  },
  {
    id: "PWR-05",
    name: "NTPC Ramagundam Super Thermal Power Station",
    state: "Telangana",
    city: "Peddapalli / Ramagundam",
    type: "Thermal Power Station",
    coordinates: [18.7550, 79.4561],  // Wikipedia: 18°45'18"N 79°27'22"E — NTPC Ramagundam
    capacity: "2,600 MW + 100 MW Floating Solar",
    status: "inactive",
    operator: "NTPC Limited",
    units: "7 Generating Units, Godavari River Cooling Water System",
    landCover: { industrialBuiltUp: 68.0, waterBody: 14.0, bareSoilPaved: 10.0, vegetationTree: 8.0, cropland: 0.0 }
  },
  {
    id: "PWR-06",
    name: "NTPC Talcher Super Thermal Power Station (Kaniha)",
    state: "Odisha",
    city: "Angul / Kaniha",
    type: "Thermal Power Station",
    coordinates: [21.0944, 85.0742],  // MapCarta/Wikipedia: 21°05'40"N 85°04'27"E — NTPC Talcher Kaniha
    capacity: "3,000 MW",
    status: "inactive",
    operator: "NTPC Limited",
    units: "6x500MW Units, Lingaraj Coal Mine MGR Feeder",
    landCover: { industrialBuiltUp: 65.0, cropland: 20.0, bareSoilPaved: 10.0, vegetationTree: 5.0, waterBody: 0.0 }
  },
  {
    id: "PWR-07",
    name: "Mundra Ultra Mega Power Plant (Tata Power)",
    state: "Gujarat",
    city: "Kutch / Mundra",
    type: "Thermal Power Station",
    coordinates: [22.8185, 69.5255],
    capacity: "4,000 MW (5x800MW Supercritical)",
    status: "inactive",
    operator: "Coastal Gujarat Power Ltd (Tata)",
    units: "Imported Coal Boiler Island, Sea Water Cooling System",
    landCover: { industrialBuiltUp: 65.0, waterBody: 22.0, bareSoilPaved: 13.0, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "PWR-08",
    name: "Adani Mundra Thermal Power Station",
    state: "Gujarat",
    city: "Kutch / Mundra",
    type: "Thermal Power Station",
    coordinates: [22.8255, 69.5545],
    capacity: "4,620 MW (4x330MW + 5x660MW)",
    status: "inactive",
    operator: "Adani Power Ltd",
    units: "Supercritical Coal Units, Deep-water Coal Unloading Jetty",
    landCover: { industrialBuiltUp: 70.0, waterBody: 18.0, bareSoilPaved: 12.0, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "PWR-09",
    name: "Chandrapur Super Thermal Power Station (CSTPS)",
    state: "Maharashtra",
    city: "Chandrapur",
    type: "Thermal Power Station",
    coordinates: [19.9855, 79.2965],
    capacity: "2,920 MW",
    status: "inactive",
    operator: "Mahagenco",
    units: "Erai Dam Reservoir Cooling, Coal Stockyard Infrastructure",
    landCover: { industrialBuiltUp: 68.0, bareSoilPaved: 16.0, waterBody: 10.0, vegetationTree: 6.0, cropland: 0.0 }
  },
  {
    id: "PWR-10",
    name: "NTPC Dadri Power Complex (Coal & Gas)",
    state: "Uttar Pradesh",
    city: "Gautam Buddha Nagar / Dadri",
    type: "Thermal Power Station",
    coordinates: [28.6055, 77.5605],
    capacity: "2,637 MW (1820MW Coal + 817MW Gas)",
    status: "inactive",
    operator: "NTPC Limited",
    units: "Combined Cycle Gas Turbines & Coal Island, NCR Grid Node",
    landCover: { industrialBuiltUp: 66.0, cropland: 28.0, bareSoilPaved: 4.0, vegetationTree: 2.0, waterBody: 0.0 }
  },

  // ==========================================
  // 3. INTEGRATED STEEL & METALLURGY PLANTS
  // ==========================================
  {
    id: "STL-01",
    name: "Tata Steel Jamshedpur Works",
    state: "Jharkhand",
    city: "Jamshedpur",
    type: "Integrated Steel Plant",
    coordinates: [22.7886, 86.1996],  // GEM.wiki: Tata Steel Jamshedpur main plant
    capacity: "11 MMTPA Crude Steel",
    status: "inactive",
    operator: "Tata Steel Limited",
    units: "Blast Furnaces (I & H), LD Steel Melt Shop, Coke Ovens, Sinter Plants",
    landCover: { industrialBuiltUp: 82.0, bareSoilPaved: 10.0, vegetationTree: 6.0, waterBody: 2.0, cropland: 0.0 }
  },
  {
    id: "STL-02",
    name: "SAIL Bhilai Steel Plant",
    state: "Chhattisgarh",
    city: "Bhilai / Durg",
    type: "Integrated Steel Plant",
    coordinates: [21.1852, 81.3942],  // GEM.wiki/MapCarta: SAIL Bhilai Steel Plant
    capacity: "7.0 MMTPA",
    status: "inactive",
    operator: "Steel Authority of India Ltd (SAIL)",
    units: "Blast Furnace #8 (Mahamaya), Rail & Heavy Structurals Mill",
    landCover: { industrialBuiltUp: 78.0, bareSoilPaved: 14.0, vegetationTree: 6.0, waterBody: 2.0, cropland: 0.0 }
  },
  {
    id: "STL-03",
    name: "SAIL Bokaro Steel Plant",
    state: "Jharkhand",
    city: "Bokaro Steel City",
    type: "Integrated Steel Plant",
    coordinates: [23.6685, 86.1555],
    capacity: "5.8 MMTPA",
    status: "inactive",
    operator: "Steel Authority of India Ltd (SAIL)",
    units: "5 Blast Furnaces, Continuous Casting Shop, Hot Strip Mill",
    landCover: { industrialBuiltUp: 76.0, bareSoilPaved: 15.0, vegetationTree: 6.0, waterBody: 3.0, cropland: 0.0 }
  },
  {
    id: "STL-04",
    name: "SAIL Rourkela Steel Plant",
    state: "Odisha",
    city: "Rourkela (Sundargarh)",
    type: "Integrated Steel Plant",
    coordinates: [22.2209, 84.8605],  // Wikipedia: 22°13'15"N 84°51'38"E — SAIL Rourkela Steel Plant
    capacity: "4.5 MMTPA",
    status: "inactive",
    operator: "Steel Authority of India Ltd (SAIL)",
    units: "Blast Furnace (Durga), Plate Mill, Special Steel for Defence",
    landCover: { industrialBuiltUp: 74.0, bareSoilPaved: 16.0, vegetationTree: 8.0, waterBody: 2.0, cropland: 0.0 }
  },
  {
    id: "STL-05",
    name: "JSW Steel Vijayanagar Works (Toranagallu)",
    state: "Karnataka",
    city: "Ballari / Toranagallu",
    type: "Integrated Steel Plant",
    coordinates: [15.1855, 76.6625],
    capacity: "12.0 MMTPA (Expanding to 18 MMTPA)",
    status: "inactive",
    operator: "JSW Steel Limited",
    units: "COREX Iron-making, Largest Blast Furnace in India, Pellet Plants",
    landCover: { industrialBuiltUp: 80.0, bareSoilPaved: 14.0, vegetationTree: 4.0, waterBody: 2.0, cropland: 0.0 }
  },
  {
    id: "STL-06",
    name: "Tata Steel Kalinganagar",
    state: "Odisha",
    city: "Jajpur / Kalinganagar",
    type: "Integrated Steel Plant",
    coordinates: [20.9650, 86.0180],
    capacity: "8.0 MMTPA",
    status: "inactive",
    operator: "Tata Steel Limited",
    units: "State-of-the-art BF & HSM, Heavy industrial corridor",
    landCover: { industrialBuiltUp: 72.0, bareSoilPaved: 18.0, vegetationTree: 6.0, cropland: 4.0, waterBody: 0.0 }
  },
  {
    id: "STL-07",
    name: "Rashtriya Ispat Nigam Ltd (RINL / Vizag Steel)",
    state: "Andhra Pradesh",
    city: "Visakhapatnam",
    type: "Integrated Steel Plant",
    coordinates: [17.6355, 83.1925],
    capacity: "7.3 MMTPA",
    status: "inactive",
    operator: "RINL (Govt of India)",
    units: "Shore-based Steel Plant, Coke Oven Battery, Sinter Plant",
    landCover: { industrialBuiltUp: 75.0, waterBody: 15.0, bareSoilPaved: 6.0, vegetationTree: 4.0, cropland: 0.0 }
  },
  {
    id: "STL-08",
    name: "AM/NS India Hazira Steel Complex",
    state: "Gujarat",
    city: "Surat / Hazira",
    type: "Integrated Steel Plant",
    coordinates: [21.1155, 72.6755],
    capacity: "9.6 MMTPA",
    status: "inactive",
    operator: "ArcelorMittal Nippon Steel (AM/NS)",
    units: "Direct Reduced Iron (DRI), Electric Arc Furnace, Corex Plants",
    landCover: { industrialBuiltUp: 81.0, waterBody: 12.0, bareSoilPaved: 5.0, vegetationTree: 2.0, cropland: 0.0 }
  },

  // ==========================================
  // 4. COAL MINES & SUBSURFACE FIRE BASINS
  // ==========================================
  {
    id: "MINE-01",
    name: "Jharia Coalfield Subsurface Mine Fires",
    state: "Jharkhand",
    city: "Dhanbad / Jharia",
    type: "Coal Mining & Subsurface Fire Basin",
    coordinates: [23.7516, 86.4203],  // Wikipedia: 23°45'06"N 86°25'13"E — Jharia coalfield centre
    capacity: "Over 60 Active Mine Fire Zones",
    status: "high_priority",
    operator: "Bharat Coking Coal Ltd (BCCL)",
    units: "Century-old subterranean coal seam oxidation, subsidence trenches",
    landCover: { bareSoilPaved: 78.0, industrialBuiltUp: 16.0, vegetationTree: 4.0, waterBody: 2.0, cropland: 0.0 }
  },
  {
    id: "MINE-02",
    name: "Korba Gevra Open-Cast Coal Mine (Largest in Asia)",
    state: "Chhattisgarh",
    city: "Korba / Gevra",
    type: "Open-Cast Coal Mine",
    coordinates: [22.3380, 82.5920],
    capacity: "50+ MMTPA Coal Extraction",
    status: "inactive",
    operator: "South Eastern Coalfields Ltd (SECL)",
    units: "Dragline extraction benches, in-pit crushing & conveyor system",
    landCover: { bareSoilPaved: 74.0, industrialBuiltUp: 18.0, vegetationTree: 6.0, cropland: 2.0, waterBody: 0.0 }
  },
  {
    id: "MINE-03",
    name: "Singrauli Jayant Open-Cast Coal Mine",
    state: "Madhya Pradesh",
    city: "Singrauli / Jayant",
    type: "Open-Cast Coal Mine",
    coordinates: [24.1845, 82.6482],
    capacity: "15 MMTPA Coal",
    status: "inactive",
    operator: "Northern Coalfields Ltd (NCL)",
    units: "Active coal bench #1-4, spontaneous coal auto-oxidation flare",
    landCover: { bareSoilPaved: 72.4, industrialBuiltUp: 21.0, vegetationTree: 6.6, cropland: 0.0, waterBody: 0.0 }
  },
  {
    id: "MINE-04",
    name: "Raniganj Coalfield Fire & Mining Belt",
    state: "West Bengal",
    city: "Asansol / Raniganj",
    type: "Coal Mining Complex",
    coordinates: [23.6200, 87.1200],
    capacity: "Eastern Coalfields Heritage Mines",
    status: "inactive",
    operator: "Eastern Coalfields Ltd (ECL)",
    units: "Underground & open-cast pits, abandoned mine fire monitoring",
    landCover: { bareSoilPaved: 66.0, industrialBuiltUp: 22.0, vegetationTree: 8.0, cropland: 4.0, waterBody: 0.0 }
  },
  {
    id: "MINE-05",
    name: "Bailadila Iron Ore Mining Complex (Deposit 14/11)",
    state: "Chhattisgarh",
    city: "Dantewada / Kirandul",
    type: "Open-Cast Iron Ore Mine",
    coordinates: [18.6650, 81.2480],
    capacity: "30 MMTPA High-Grade Iron Ore",
    status: "inactive",
    operator: "NMDC Limited",
    units: "Hilltop open pit extraction, ore processing & slurry pipelines",
    landCover: { bareSoilPaved: 60.0, vegetationTree: 30.0, industrialBuiltUp: 10.0, cropland: 0.0, waterBody: 0.0 }
  },

  // ==========================================
  // 5. CHEMICAL & SPECIAL PETROCHEMICAL ZONES
  // ==========================================
  {
    id: "CHEM-01",
    name: "Dahej Petroleum, Chemicals & Petrochemicals Investment Region (PCPIR)",
    state: "Gujarat",
    city: "Bharuch / Dahej",
    type: "Chemical & Industrial Estate",
    coordinates: [21.7120, 72.5850],
    capacity: "453 Sq Km Megazone (OPaL, GNFC, Petronet LNG)",
    status: "inactive",
    operator: "ONGC Petro additions Ltd (OPaL) / GIDC",
    units: "Dual Feed Cracker Unit (1.1 MMTPA Ethylene), LNG Regas Terminal",
    landCover: { industrialBuiltUp: 78.0, waterBody: 14.0, bareSoilPaved: 8.0, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "CHEM-02",
    name: "Ankleshwar Chemical Industrial Estate (GIDC)",
    state: "Gujarat",
    city: "Ankleshwar",
    type: "Chemical & Industrial Estate",
    coordinates: [21.6280, 73.0120],
    capacity: "1,500+ Chemical & Pharma Units",
    status: "inactive",
    operator: "Gujarat Industrial Development Corporation",
    units: "Dyes, Pigments, Pharmaceuticals, Centralized Effluent Incineration",
    landCover: { industrialBuiltUp: 85.0, bareSoilPaved: 10.0, cropland: 3.0, vegetationTree: 2.0, waterBody: 0.0 }
  },
  {
    id: "CHEM-03",
    name: "Hazira Heavy Industrial Zone (Shell/Total LNG & L&T)",
    state: "Gujarat",
    city: "Surat / Hazira",
    type: "LNG & Heavy Chemical Port",
    coordinates: [21.1180, 72.6510],
    capacity: "5 MMTPA LNG Regas + Cryogenic Storage",
    status: "inactive",
    operator: "Shell / TotalEnergies / L&T Heavy Eng",
    units: "Cryogenic Tanks, Gas Flares, Heavy Modular Fabrication Yard",
    landCover: { industrialBuiltUp: 82.1, waterBody: 14.5, bareSoilPaved: 3.4, vegetationTree: 0.0, cropland: 0.0 }
  },

  // ==========================================
  // 6. ECOLOGICAL & FORESTRY MONITORING HUBS
  // ==========================================
  {
    id: "FOR-01",
    name: "Simlipal Biosphere Reserve Core & Buffer",
    state: "Odisha",
    city: "Mayurbhanj / Baripada",
    type: "Protected Biosphere Reserve",
    coordinates: [21.8651, 86.3294],
    capacity: "2,750 Sq Km Deciduous Forest Canopy",
    status: "high_priority",
    operator: "Odisha Forest Department & ODRAF",
    units: "Tiger Reserve, Dense Sal Canopy, Fast-moving seasonal fireline",
    landCover: { vegetationTree: 88.4, shrubland: 7.2, cropland: 3.1, bareSoilPaved: 1.3, industrialBuiltUp: 0.0 }
  },
  {
    id: "FOR-02",
    name: "Bandhavgarh National Park Forest Zone",
    state: "Madhya Pradesh",
    city: "Umaria",
    type: "Protected Natural Forest",
    coordinates: [23.7020, 81.0250],
    capacity: "1,536 Sq Km Protected Forest",
    status: "inactive",
    operator: "MP Forest Department",
    units: "Moist deciduous forest, seasonal leaf-litter fire tracking",
    landCover: { vegetationTree: 85.0, shrubland: 10.0, cropland: 4.0, bareSoilPaved: 1.0, industrialBuiltUp: 0.0 }
  },
  {
    id: "FOR-03",
    name: "Garhwal Himalayan Pine Forest Fire Corridor",
    state: "Uttarakhand",
    city: "Pauri / Chamoli",
    type: "Protected Mountain Forest",
    coordinates: [30.1500, 78.8000],
    capacity: "Chir Pine Forest Elevation Belt",
    status: "inactive",
    operator: "Uttarakhand Forest Fire Disaster Wing",
    units: "Resin-rich Pine needles, steep slope thermal propagation",
    landCover: { vegetationTree: 82.0, bareSoilPaved: 12.0, shrubland: 6.0, cropland: 0.0, industrialBuiltUp: 0.0 }
  },

  {
    id: "FOR-04",
    name: "Jim Corbett National Park Himalayan Foothills",
    state: "Uttarakhand",
    city: "Ramnagar / Nainital",
    type: "Protected Mountain Forest",
    coordinates: [29.5300, 78.7740],
    capacity: "1,288 Sq Km Sal & Deciduous Canopy",
    status: "inactive",
    operator: "Uttarakhand Forest Department",
    units: "Foothill pine & sal biomass, dry season fire surveillance",
    landCover: { vegetationTree: 86.0, shrubland: 8.0, cropland: 3.0, bareSoilPaved: 3.0, industrialBuiltUp: 0.0 }
  },
  {
    id: "FOR-05",
    name: "Western Ghats Silent Valley & Nilgiri Biosphere",
    state: "Kerala",
    city: "Palakkad / Nilgiris",
    type: "Protected Rainforest Biosphere",
    coordinates: [11.0840, 76.4420],
    capacity: "UNESCO World Heritage Biodiversity Hotspot",
    status: "inactive",
    operator: "Kerala Forest & Wildlife Department",
    units: "Tropical evergreen rainforest, peripheral grassland firelines",
    landCover: { vegetationTree: 92.0, shrubland: 5.0, waterBody: 3.0, bareSoilPaved: 0.0, industrialBuiltUp: 0.0 }
  },
  {
    id: "FOR-06",
    name: "Kaziranga National Park Floodplain Buffer",
    state: "Assam",
    city: "Golaghat / Nagaon",
    type: "Protected Grassland & Wetland",
    coordinates: [26.5770, 93.1710],
    capacity: "430 Sq Km Alluvial Grassland Matrix",
    status: "inactive",
    operator: "Assam Forest Department",
    units: "Tall elephant grass, controlled seasonal habitat management",
    landCover: { vegetationTree: 55.0, shrubland: 25.0, waterBody: 15.0, cropland: 5.0, industrialBuiltUp: 0.0 }
  },

  // ==========================================
  // 7. AGRARIAN CROP STUBBLE BURNING CORRIDORS
  // ==========================================
  {
    id: "AGR-01",
    name: "Patiala & Sangrur Paddy Stubble Burning Belt",
    state: "Punjab",
    city: "Patiala / Sangrur",
    type: "Agrarian Cropland Matrix",
    coordinates: [30.3750, 76.1520],
    capacity: "Major Post-Harvest Stubble Corridor",
    status: "inactive",
    operator: "Punjab Pollution Control Board (PPCB)",
    units: "Seasonal Paddy Field Straw Burning, Short-lived Ephemeral Fires",
    landCover: { cropland: 91.5, industrialBuiltUp: 4.2, vegetationTree: 3.1, bareSoilPaved: 1.2, waterBody: 0.0 }
  },
  {
    id: "AGR-02",
    name: "Ludhiana & Khanna Agro-Industrial Burning Cluster",
    state: "Punjab",
    city: "Ludhiana / Khanna",
    type: "Agrarian Cropland Matrix",
    coordinates: [30.7050, 75.8500],
    capacity: "Wheat-Paddy Crop Rotation Zone",
    status: "inactive",
    operator: "State Pollution Control Board",
    units: "Agricultural residue fires, farm parcel boundaries",
    landCover: { cropland: 88.0, industrialBuiltUp: 7.0, vegetationTree: 3.0, bareSoilPaved: 2.0, waterBody: 0.0 }
  },
  {
    id: "AGR-03",
    name: "Karnal & Kaithal Stubble Belt",
    state: "Haryana",
    city: "Karnal / Kaithal",
    type: "Agrarian Cropland Matrix",
    coordinates: [29.6850, 76.9900],
    capacity: "Upper Indo-Gangetic Plains Farm Grid",
    status: "inactive",
    operator: "Haryana State Pollution Control Board",
    units: "Post-harvest crop residue burns, NCR air corridor",
    landCover: { cropland: 90.0, industrialBuiltUp: 5.0, vegetationTree: 3.0, bareSoilPaved: 2.0, waterBody: 0.0 }
  },
  {
    id: "AGR-04",
    name: "Bathinda & Mansa Cotton-Paddy Agrarian Zone",
    state: "Punjab",
    city: "Bathinda / Mansa",
    type: "Agrarian Cropland Matrix",
    coordinates: [29.9850, 75.2400],
    capacity: "Intensive Stubble Fire Detection Sector",
    status: "inactive",
    operator: "Punjab Agriculture Department",
    units: "Post-harvest farm fires, rapid localized biomass burning",
    landCover: { cropland: 92.0, bareSoilPaved: 4.0, vegetationTree: 3.0, industrialBuiltUp: 1.0, waterBody: 0.0 }
  },
  {
    id: "AGR-05",
    name: "Amritsar & Tarn Taran Border Agriculture Zone",
    state: "Punjab",
    city: "Amritsar / Tarn Taran",
    type: "Agrarian Cropland Matrix",
    coordinates: [31.5200, 74.9200],
    capacity: "Early Harvest Paddy Belt",
    status: "inactive",
    operator: "Punjab Pollution Control Board",
    units: "High-density crop residue burn detections",
    landCover: { cropland: 93.0, industrialBuiltUp: 3.0, vegetationTree: 2.0, bareSoilPaved: 2.0, waterBody: 0.0 }
  },
  {
    id: "AGR-06",
    name: "Muzaffarnagar & Meerut Sugarcane Trash Burn Grid",
    state: "Uttar Pradesh",
    city: "Muzaffarnagar / Meerut",
    type: "Agrarian Cropland Matrix",
    coordinates: [29.4700, 77.7000],
    capacity: "Western UP Agro-Industrial Belt",
    status: "inactive",
    operator: "UP Pollution Control Board",
    units: "Sugarcane dry foliage and stubble open burning",
    landCover: { cropland: 89.0, industrialBuiltUp: 6.0, vegetationTree: 3.0, bareSoilPaved: 2.0, waterBody: 0.0 }
  },

  // ==========================================
  // 8. ULTRA-MEGA SOLAR PARKS (GLINT SUPPRESSION)
  // ==========================================
  {
    id: "SOL-01",
    name: "Bhadla Mega Solar Park (Phase I-IV)",
    state: "Rajasthan",
    city: "Phalodi / Jodhpur",
    type: "Ultra Mega Solar Park",
    coordinates: [27.5385, 71.9165],
    capacity: "2,245 MW (World's Largest Solar Park)",
    status: "inactive",
    operator: "NTPC / Adani Green / Hero Future",
    units: "14,000 Acres Photovoltaic Glass Arrays, 765kV Pooling Substation",
    landCover: { bareSoilPaved: 72.4, industrialBuiltUp: 26.2, waterBody: 1.4, vegetationTree: 0.0, cropland: 0.0 }
  },
  {
    id: "SOL-02",
    name: "Pavagada Solar Park (Shakti Sthala)",
    state: "Karnataka",
    city: "Tumkur / Pavagada",
    type: "Ultra Mega Solar Park",
    coordinates: [14.2815, 77.4125],
    capacity: "2,050 MW",
    status: "inactive",
    operator: "Karnataka Solar Power Development Corp (KSPDCL)",
    units: "13,000 Acres Solar PV, Optical Glint Suppression Area",
    landCover: { bareSoilPaved: 74.0, industrialBuiltUp: 24.0, vegetationTree: 2.0, waterBody: 0.0, cropland: 0.0 }
  },
  {
    id: "SOL-03",
    name: "Kurnool Ultra Mega Solar Park",
    state: "Andhra Pradesh",
    city: "Kurnool / Gani",
    type: "Ultra Mega Solar Park",
    coordinates: [15.6805, 78.2805],
    capacity: "1,000 MW",
    status: "inactive",
    operator: "AP Solar Power Corporation",
    units: "5,932 Acres High Albedo Solar Arrays",
    landCover: { bareSoilPaved: 76.0, industrialBuiltUp: 22.0, vegetationTree: 2.0, waterBody: 0.0, cropland: 0.0 }
  },
  {
    id: "SOL-04",
    name: "Rewa Ultra Mega Solar Complex",
    state: "Madhya Pradesh",
    city: "Rewa / Gurh",
    type: "Ultra Mega Solar Park",
    coordinates: [24.4785, 81.5755],
    capacity: "750 MW (DMRC Clean Energy Supplier)",
    status: "inactive",
    operator: "Rewa Ultra Mega Solar Ltd (RUMSL)",
    units: "Grid connected solar panels, high specular reflection zone",
    landCover: { bareSoilPaved: 70.0, industrialBuiltUp: 26.0, vegetationTree: 4.0, waterBody: 0.0, cropland: 0.0 }
  },
  {
    id: "SOL-05",
    name: "Charanka Solar Park (Gujarat Solar Park-1)",
    state: "Gujarat",
    city: "Patan / Radhanpur",
    type: "Ultra Mega Solar Park",
    coordinates: [23.9055, 71.2005],
    capacity: "790 MW",
    status: "inactive",
    operator: "Gujarat Power Corporation Ltd (GPCL)",
    units: "Saline desert terrain, utility-scale photovoltaic arrays",
    landCover: { bareSoilPaved: 78.0, industrialBuiltUp: 20.0, waterBody: 2.0, vegetationTree: 0.0, cropland: 0.0 }
  }
];
