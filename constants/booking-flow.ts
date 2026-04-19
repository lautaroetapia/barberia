export type BookingService = {
  id: string;
  name: string;
  duration: string;
  price: string;
  image: string;
};

export type BookingBarber = {
  id: string;
  name: string;
  specialty: string;
  rating: string;
  reviews: string;
  image: string;
};

export type BookingTimeSlot = {
  id: string;
  time: string;
  label?: string;
  disabled?: boolean;
};

export const bookingServices: BookingService[] = [
  {
    id: "service-haircut",
    name: "Corte de Cabello",
    duration: "45 min",
    price: "$35",
    image:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "service-beard",
    name: "Perfilado de Barba",
    duration: "30 min",
    price: "$20",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "service-ritual",
    name: "Ritual Toalla Caliente",
    duration: "60 min",
    price: "$45",
    image:
      "https://images.unsplash.com/photo-1598908314766-3d2b274296ce?q=80&w=1000&auto=format&fit=crop",
  },
];

export const bookingBarbers: BookingBarber[] = [
  {
    id: "barber-any",
    name: "Cualquier barbero",
    specialty: "El primero disponible",
    rating: "",
    reviews: "",
    image: "",
  },
  {
    id: "barber-julian",
    name: "Julian Rossi",
    specialty: "Especialista en degradados",
    rating: "4.9",
    reviews: "124",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7zRxZgcbJvS1cG1ZiTDd9OFEqUmCIyRtgBhMS5tGUWtZjpLpx_QtWCU58Yk90X8Gg02x2JjvCcbj8oloXNK_MWHiOKHYpZak7GlZP2ZwVJkKWl6wyv6AJkEgitM_Jiiyk1EZkYQXyu3Ex436aPb-ejIu_9WBC3uY9a5qbjS7WDFUqI-MVOShFx6kWGItoYfwRHFl-cBIDV4OHLg2lakOOGTwmm_wYL94QMMr5dD7WKUNBqzHns4O4pYiNqRbwvgpwC8VII7iMGm57",
  },
  {
    id: "barber-mateo",
    name: "Mateo Silva",
    specialty: "Barba y toalla caliente",
    rating: "4.8",
    reviews: "89",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA30DGcJnFlUsMm2mvLw2JyuxTnYIi-GxWECyS9qMHXe7ySjKj8xtZXnUFkh9Hp5xK8JTMw8dn3ud25hmsbB7_ICdHFQApOlSKQuhFZyRt9b3x7LBmcrqo62MBNSxw8vKR-nWaNZWphOZMott2453zvy94HhrknYo7ljfF20lRTJPYgC1J33YeN4q3y-4AtETFVAVZwqjW5jVPXdsawXyCZC1R4FBdyfGjBkHkmlGPKIV0R4LBzcakZ2pnmom-0mApspGa5z6DtzdAc",
  },
  {
    id: "barber-lucas",
    name: "Lucas Martin",
    specialty: "Cortes clasicos",
    rating: "5.0",
    reviews: "210",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbXWfHC36BNG_oNpvrjqmOQR6kf_cK70UiicNLxt9pl6hQqnB28UTMBlK-Y9XkUensSt4voZ_97GnMWL6YuIQrIlOsCQGTnbsmufWv7t85KuJR4z3n6-EM4hLx9sPXZ3k5N9uefg2DidxqysnNqPelltrQD3Qub6nAwACMp52n_qsdec864fupypyM95UF4j90ujkktoeiPErin4aaRVjg4GJFvejoUstmLcThXozmyGu-PkjZb-lX19l9kfzBkYiyTqa5pUlyyOSu",
  },
];

export const bookingTimeSlotsMorning: BookingTimeSlot[] = [
  { id: "09:00", time: "09:00" },
  { id: "09:45", time: "09:45" },
  { id: "10:30", time: "10:30" },
  { id: "11:15", time: "11:15", disabled: true },
];

export const bookingTimeSlotsAfternoon: BookingTimeSlot[] = [
  { id: "14:00", time: "14:00" },
  { id: "14:45", time: "14:45" },
  { id: "16:30", time: "16:30", label: "Terminaras aprox. 17:15" },
  { id: "17:15", time: "17:15" },
  { id: "18:00", time: "18:00" },
];

export const bookingDateLabel = "Martes 16 de Octubre";

export const getServiceById = (id?: string) =>
  bookingServices.find((item) => item.id === id) ?? bookingServices[0];

export const getBarberById = (id?: string) =>
  bookingBarbers.find((item) => item.id === id) ?? bookingBarbers[0];
