export interface MeeqatPoint {
  id: string
  name: string
  lat: number
  lng: number
  color: string
  direction: string
  distance: string
  forPilgrims: string
}

export const MEEQAT_POINTS: MeeqatPoint[] = [
  {
    id: 'dhul-hulayfah',
    name: 'Dhul-Hulayfah (Abyar Ali)',
    lat: 24.41406002656528,
    lng: 39.54286561840277,
    color: '#e74c3c',
    direction: 'North',
    distance: '~450 km',
    forPilgrims: 'People from Madinah and regions to the north',
  },
  {
    id: 'al-juhfah',
    name: 'Al-Juhfah (Rabigh)',
    lat: 22.70560101031339,
    lng: 39.14643816586369,
    color: '#3498db',
    direction: 'Northwest',
    distance: '~187 km',
    forPilgrims: 'People from Syria, Egypt, Morocco, and the west',
  },
  {
    id: 'qarn-al-manazil',
    name: 'Qarn al-Manazil (As-Sayl)',
    lat: 21.632843070547295,
    lng: 40.42803494940863,
    color: '#f39c12',
    direction: 'East',
    distance: '~94 km',
    forPilgrims: 'People from Najd and regions to the east',
  },
  {
    id: 'dhat-irq',
    name: "Dhat 'Irq",
    lat: 21.930162470128362,
    lng: 40.425496742328555,
    color: '#27ae60',
    direction: 'Northeast',
    distance: '~94 km',
    forPilgrims: 'People from Iraq and regions to the northeast',
  },
  {
    id: 'yalamlam',
    name: "Yalamlam (Sa'diyah)",
    lat: 20.517434830881925,
    lng: 39.871136544178604,
    color: '#9b59b6',
    direction: 'South',
    distance: '~120 km',
    forPilgrims: 'People from Yemen and regions to the south',
  },
]

export const MAKKAH: [number, number] = [21.4225, 39.8262]
