import type { LogRecord, Renewal, ServiceItem, Vehicle } from "./types";

// Sample garage used until Supabase is connected. Dates are relative to today so
// the statuses (overdue, due soon, all good) always look right in a demo.
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const sampleVehicles: Vehicle[] = [
  {
    id: "corolla",
    type: "car",
    make: "Toyota",
    model: "Corolla",
    year: 2005,
    fuel: "petrol",
    color: "Silver",
    province: "NC",
    plate: "JO-8663",
    odometerKm: 54320,
    odometerUpdatedAt: inDays(-3),
    photo: require("../../assets/vehicles/corolla.jpg"),
  },
  {
    id: "jeep",
    type: "suv",
    make: "Mitsubishi",
    model: "Jeep",
    fuel: "diesel",
    color: "Green",
    plate: "31-8899",
    odometerKm: 88150,
    odometerUpdatedAt: inDays(-9),
    photo: require("../../assets/vehicles/jeep.jpg"),
  },
  {
    id: "hilux",
    type: "pickup",
    make: "Toyota",
    model: "Hilux",
    fuel: "diesel",
    color: "Red",
    plate: "56-6383",
    odometerKm: 212400,
    odometerUpdatedAt: inDays(-14),
    photo: require("../../assets/vehicles/hilux.jpg"),
  },
  {
    id: "ax1",
    type: "motorbike",
    make: "Honda",
    model: "AX-1",
    fuel: "petrol",
    province: "NW",
    plate: "BAW-7715",
    odometerKm: 41200,
    odometerUpdatedAt: inDays(-5),
    photo: require("../../assets/vehicles/ax1.jpg"),
  },
];

export const sampleRenewals: Renewal[] = [
  { id: "r1", vehicleId: "corolla", kind: "revenue_license", expiresOn: inDays(12) },
  { id: "r2", vehicleId: "corolla", kind: "insurance", provider: "Ceylinco", expiresOn: inDays(140) },
  { id: "r3", vehicleId: "corolla", kind: "emission_test", expiresOn: inDays(248) },
  { id: "r4", vehicleId: "jeep", kind: "emission_test", expiresOn: inDays(-3) },
  { id: "r5", vehicleId: "jeep", kind: "revenue_license", expiresOn: inDays(96) },
  { id: "r6", vehicleId: "hilux", kind: "insurance", expiresOn: inDays(61) },
  { id: "r7", vehicleId: "ax1", kind: "revenue_license", expiresOn: inDays(203) },
];

export const sampleServiceItems: ServiceItem[] = [
  { id: "s1", vehicleId: "corolla", name: "Oil and filter", intervalKm: 5000, lastDoneKm: 52640 - 1640 },
  { id: "s2", vehicleId: "corolla", name: "Tyres", intervalKm: 30000, lastDoneKm: 42720 },
  { id: "s3", vehicleId: "corolla", name: "Spark plugs", intervalKm: 30000, lastDoneKm: 50020 },
  { id: "s4", vehicleId: "jeep", name: "Oil and filter", intervalKm: 5000, lastDoneKm: 84750 },
  { id: "s5", vehicleId: "hilux", name: "Oil and filter", intervalKm: 5000, lastDoneKm: 209900 },
  { id: "s6", vehicleId: "ax1", name: "Chain and sprocket", intervalKm: 15000, lastDoneKm: 33000 },
];

export const sampleRecords: LogRecord[] = [
  { id: "l1", vehicleId: "corolla", kind: "fuel", title: "Fuel, 32 L", place: "Marawila", odometerKm: 54100, date: inDays(-3), amountLkr: 9856 },
  { id: "l2", vehicleId: "corolla", kind: "service", title: "Full service", place: "Lanka Auto Care", odometerKm: 52640, date: inDays(-9), amountLkr: 18500 },
  { id: "l3", vehicleId: "corolla", kind: "repair", title: "Two tyres replaced", place: "DSI Tyres", odometerKm: 48900, date: inDays(-52), amountLkr: 46000 },
  { id: "l4", vehicleId: "jeep", kind: "fuel", title: "Fuel, 40 L", place: "Chilaw", odometerKm: 88000, date: inDays(-6), amountLkr: 12400 },
  { id: "l5", vehicleId: "hilux", kind: "service", title: "Oil change", place: "Wennappuwa", odometerKm: 209900, date: inDays(-20), amountLkr: 11000 },
  { id: "l6", vehicleId: "ax1", kind: "fuel", title: "Fuel, 6 L", place: "Marawila", odometerKm: 41150, date: inDays(-2), amountLkr: 2200 },
];
