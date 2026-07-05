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
    lat: 24.4167,
    lng: 39.5333,
    color: '#2ecc71',
    direction: 'North',
    distance: '450 km',
    forPilgrims: 'Pilgrims from Madinah and those passing through it',
  },
  {
    id: 'al-juhfah',
    name: 'Al-Juhfah (Rabigh)',
    lat: 22.75,
    lng: 39.05,
    color: '#3498db',
    direction: 'Northwest',
    distance: '183 km',
    forPilgrims: 'Pilgrims from Syria, Egypt, Morocco, and the West',
  },
  {
    id: 'qarn-al-manazil',
    name: 'Qarn al-Manazil (As-Sayl)',
    lat: 21.6667,
    lng: 40.4167,
    color: '#e67e22',
    direction: 'East',
    distance: '94 km',
    forPilgrims: 'Pilgrims from Najd and those passing through it',
  },
  {
    id: 'dhat-irq',
    name: "Dhat Irq (Al-Dhari'ah)",
    lat: 21.9833,
    lng: 40.6167,
    color: '#9b59b6',
    direction: 'Northeast',
    distance: '94 km',
    forPilgrims: 'Pilgrims from Iraq, Iran, and the East',
  },
  {
    id: 'yalamlam',
    name: 'Yalamlam (As-Sa\'diyah)',
    lat: 21.1167,
    lng: 39.8333,
    color: '#e74c3c',
    direction: 'South',
    distance: '92 km',
    forPilgrims: 'Pilgrims from Yemen and those passing through it',
  },
]

export const MAKKAH: [number, number] = [21.4225, 39.8262]
