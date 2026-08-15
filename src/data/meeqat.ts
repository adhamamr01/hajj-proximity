export interface MeeqatPoint {
  id: string
  name: string
  nameAr: string
  lat: number
  lng: number
  color: string
  direction: string
  distance: string
  forPilgrims: string
  forPilgrimsAr: string
}

export const MEEQAT_POINTS: MeeqatPoint[] = [
  {
    id: 'dhul-hulayfah',
    name: 'Dhul-Hulayfah (Abyar Ali)',
    nameAr: 'ذو الحليفة (أبيار علي)',
    lat: 24.41406002656528,
    lng: 39.54286561840277,
    color: '#e74c3c',
    direction: 'North',
    distance: '~450 km',
    forPilgrims: 'People from Madinah and regions to the north',
    forPilgrimsAr: 'أهل المدينة ومن مر بها من الجهة الشمالية',
  },
  {
    id: 'al-juhfah',
    name: 'Al-Juhfah (Rabigh)',
    nameAr: 'الجحفة (رابغ)',
    lat: 22.70560101031339,
    lng: 39.14643816586369,
    color: '#3498db',
    direction: 'Northwest',
    distance: '~187 km',
    forPilgrims: 'People from Syria, Egypt, Morocco, and the west',
    forPilgrimsAr: 'أهل الشام ومصر والمغرب والجهة الغربية',
  },
  {
    id: 'qarn-al-manazil',
    name: 'Qarn al-Manazil (As-Sayl)',
    nameAr: 'قرن المنازل (السيل الكبير)',
    lat: 21.632843070547295,
    lng: 40.42803494940863,
    color: '#f39c12',
    direction: 'East',
    distance: '~94 km',
    forPilgrims: 'People from Najd and regions to the east',
    forPilgrimsAr: 'أهل نجد ومن مر بها من الجهة الشرقية',
  },
  {
    id: 'dhat-irq',
    name: "Dhat 'Irq",
    nameAr: 'ذات عرق',
    lat: 21.930162470128362,
    lng: 40.425496742328555,
    color: '#27ae60',
    direction: 'Northeast',
    distance: '~94 km',
    forPilgrims: 'People from Iraq and regions to the northeast',
    forPilgrimsAr: 'أهل العراق والجهة الشمالية الشرقية',
  },
  {
    id: 'yalamlam',
    name: "Yalamlam (Sa'diyah)",
    nameAr: 'يلملم (السعدية)',
    lat: 20.517434830881925,
    lng: 39.871136544178604,
    color: '#9b59b6',
    direction: 'South',
    distance: '~120 km',
    forPilgrims: 'People from Yemen and regions to the south',
    forPilgrimsAr: 'أهل اليمن ومن مر بها من الجهة الجنوبية',
  },
]

export const MAKKAH: [number, number] = [21.4225, 39.8262]
