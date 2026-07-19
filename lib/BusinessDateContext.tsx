"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "@/lib/StoreContext";
import { businessDateFor } from "@/lib/types";

type BusinessDateContextValue = {
  date: string;
  setDate: (d: string) => void;
  isToday: boolean;
  goToday: () => void;
  shiftDay: (delta: number) => void;
};

const BusinessDateContext = createContext<BusinessDateContextValue>({
  date: businessDateFor(new Date()),
  setDate: () => {},
  isToday: true,
  goToday: () => {},
  shiftDay: () => {},
});

export function BusinessDateProvider({ children }: { children: React.ReactNode }) {
  const { cutoffHour } = useStore();
  const todayDate = businessDateFor(new Date(), cutoffHour);
  const [date, setDate] = useState(todayDate);

  function goToday() {
    setDate(businessDateFor(new Date(), cutoffHour));
  }

  function shiftDay(delta: number) {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }

  return (
    <BusinessDateContext.Provider value={{ date, setDate, isToday: date === todayDate, goToday, shiftDay }}>
      {children}
    </BusinessDateContext.Provider>
  );
}

export function useBusinessDate() {
  return useContext(BusinessDateContext);
}
