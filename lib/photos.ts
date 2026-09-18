export type Photo = {
  src: `/${string}`
  alt: string
  credit: string
}

export const photos = {
  keys: {
    src: "/images/keys.jpg",
    alt: "A house key lying on a printed floor plan",
    credit: "Tierra Mallorca / Unsplash",
  },
  apartment: {
    src: "/images/apartment.jpg",
    alt: "A bright living room with a sofa and a wide window",
    credit: "Unsplash",
  },
  phone: {
    src: "/images/phone.jpg",
    alt: "Two hands holding a smartphone",
    credit: "Rami Al-zayat / Unsplash",
  },
  parking: {
    src: "/images/parking.jpg",
    alt: "An open outdoor parking lot in daylight",
    credit: "Unsplash",
  },
  documents: {
    src: "/images/documents.jpg",
    alt: "Papers, a pen, and a calculator on a desk",
    credit: "Scott Graham / Unsplash",
  },
  calendar: {
    src: "/images/calendar.jpg",
    alt: "A wall calendar with handwritten notes",
    credit: "Brooke Lark / Unsplash",
  },
  staff: {
    src: "/images/staff.jpg",
    alt: "A staff member at a desk looking at a laptop",
    credit: "Christina @ wocintechchat / Unsplash",
  },
  kitchen: {
    src: "/images/kitchen.jpg",
    alt: "A kitchen counter with food being prepared",
    credit: "Chad Montano / Unsplash",
  },
  nightCity: {
    src: "/images/night-city.jpg",
    alt: "A city skyline at night",
    credit: "Pedro Lastra / Unsplash",
  },
  van: {
    src: "/images/van.jpg",
    alt: "A van parked along an open road",
    credit: "Unsplash",
  },
  building: {
    src: "/images/building.jpg",
    alt: "A multi-story apartment building",
    credit: "Unsplash",
  },
  community: {
    src: "/images/community.jpg",
    alt: "People standing in a circle holding hands",
    credit: "Hannah Busing / Unsplash",
  },
  savings: {
    src: "/images/savings.jpg",
    alt: "Glass jars holding coins and cash",
    credit: "Unsplash",
  },
  garage: {
    src: "/images/garage.jpg",
    alt: "Cars parked in a covered garage",
    credit: "Unsplash",
  },
  provider: {
    src: "/images/provider.jpg",
    alt: "A person presenting notes at a meeting table",
    credit: "Amy Hirschi / Unsplash",
  },
  exterior: {
    src: "/images/exterior.jpg",
    alt: "The front of a well-kept house at dusk",
    credit: "Unsplash",
  },
  window: {
    src: "/images/window.jpg",
    alt: "An apartment interior seen through a large window",
    credit: "Unsplash",
  },
  work: {
    src: "/images/work.jpg",
    alt: "People at a table with laptops and notes",
    credit: "Unsplash",
  },
} as const satisfies Record<string, Photo>
