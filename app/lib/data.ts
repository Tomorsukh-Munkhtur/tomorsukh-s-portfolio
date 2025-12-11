export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  images?: string[]; // Multiple images support
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: '1',
    title: 'E-Commerce Mobile App',
    description: 'Зөн совинтой навигаци, төлбөр тооцооны саадгүй урсгал бүхий худалдааны аппликейшн.',
    category: 'Мобайл дизайн',
    imageUrl: '/projects/ecommerce.jpg',
    featured: true,
  },
  {
    id: '2',
    title: 'Banking Dashboard',
    description: 'Бодит цагийн аналитик, гүйлгээний удирдлага бүхий санхүүгийн хяналтын самбар.',
    category: 'Веб дизайн',
    imageUrl: '/projects/banking.jpg',
    featured: true,
  },
  {
    id: '3',
    title: 'Fitness Tracking App',
    description: 'Дасгалын төлөвлөгөө, ахиц дэвшлийг хянах фитнесс аппликейшн.',
    category: 'Мобайл дизайн',
    imageUrl: '/projects/fitness.jpg',
    featured: true,
  },
  {
    id: '4',
    title: 'Restaurant Booking Platform',
    description: 'Цэс үзэх, ширээ захиалах боломжтой рестораны захиалгын систем.',
    category: 'Веб дизайн',
    imageUrl: '/projects/restaurant.jpg',
    featured: false,
  },
  {
    id: '5',
    title: 'Travel Planning App',
    description: 'Аяллын маршрут төлөвлөх, захиалга хийх цогц аппликейшн.',
    category: 'Мобайл дизайн',
    imageUrl: '/projects/travel.jpg',
    featured: false,
  },
  {
    id: '6',
    title: 'Project Management Tool',
    description: 'Багийн харилцаа холбоо, даалгавар хянах хамтын ажиллагааны хэрэгсэл.',
    category: 'Веб дизайн',
    imageUrl: '/projects/project-mgmt.jpg',
    featured: false,
  },
  {
    id: '7',
    title: 'Digital Illustration Set',
    description: 'SaaS вебсайтад зориулсан дижитал иллюстрацийн цуглуулга.',
    category: 'Дижитал зураг',
    imageUrl: '/projects/illustration.jpg',
    featured: false,
  },
  {
    id: '8',
    title: 'Enterprise CMS',
    description: 'Байгууллагын контент, ажлын урсгалыг удирдах цогц веб систем.',
    category: 'Веб систем',
    imageUrl: '/projects/websystem.jpg',
    featured: false,
  },
  {
    id: '9',
    title: 'Tech Startup Logo',
    description: 'Финтек стартапд зориулсан орчин үеийн, минималист лого дизайн.',
    category: 'Лого',
    imageUrl: '/projects/logo.jpg',
    featured: false,
  },
  {
    id: '10',
    title: 'Brand Guideline Book',
    description: 'Типограф, өнгөний палитр, хэрэглээний дүрмийг тодорхойлсон брэндбүүк.',
    category: 'Брэндбүүк',
    imageUrl: '/projects/brandbook.jpg',
    featured: false,
  },
];
export interface Message {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: number;
  read: boolean;
}
