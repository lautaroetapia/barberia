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

const formatBookingDateLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(date)
    .replace(/^./, (char) => char.toUpperCase());

export const bookingDateLabel = formatBookingDateLabel(new Date());
