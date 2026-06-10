export type ConciergeUnitOption = {
  id: number;
  name: string;
  hourStart: string;
  hourFinish: string;
};

export type ConciergeDateOption = {
  isoDate: string;
  label: string;
};

export type ConciergePeriodOption = {
  key: "MORNING" | "AFTERNOON" | "EVENING";
  label: string;
  availableStarts: number;
  totalStarts: number;
};

export type ConciergeSlotOption = {
  slotLabel: string;
  hourIni: string;
  hourFinish: string;
  professionalsAvailable: number;
};

export type ConciergeProfessionalOption = {
  id: number;
  name: string;
};

export type ConciergeServiceOption = {
  id: number;
  name: string;
  durationMin: number;
  availableStarts: number;
  totalStarts: number;
};

export type ConciergeServiceCategory = {
  id: number;
  name: string;
  services: ConciergeServiceOption[];
};

export type ConciergeBookingContext = {
  units: ConciergeUnitOption[];
  dates: ConciergeDateOption[];
};
