import {
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconMoodSmile,
  IconBorderAll,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconAperture,
  IconShoppingCart,
  IconHelp,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconLayout,
  IconZoomCode,
  IconSettings,
  IconBorderStyle2,
  IconAppWindow,
  IconLockAccess,
  IconListDetails,
  IconListNumbers,

  IconSearch,
  IconFileSearch,

} from '@tabler/icons';

import { uniqueId } from 'lodash';

const Menuitems = [


  // Nicolas
  {
    navlabel: true,
    subheader: 'Test Page Detection',

  },

  {
    id: uniqueId(),
    title: 'Accueil',
    icon: IconFileSearch,
    href: '/Accueil',
  },

  // marwane 
  // {
  //   id: uniqueId(),
  //   title: 'Tracage Zone De Detection',
  //   icon: IconFileSearch,
  //   href: '/tracage_zone_de_detection',
  // },

  
  // {
  //   id: uniqueId(),
  //   title: 'Reconaissance faciale',
  //   icon: IconFileSearch,
  //   href: '/reconaissancefacielle',
  // },
 
 
 
  {
    id: uniqueId(),
    title: 'Body DETECTION',
    icon: IconFileSearch,
    href: '/detection_body_nicolas',
  },
 
  {
    id: uniqueId(),
    title: 'Page de Logs',
    icon: IconFileSearch,
    href: '/logspage',
  },





  // Yacine
  
  {
    navlabel: true,
    subheader: 'Configuration',
  },


  {
    id: uniqueId(),
    title: 'User Management',
    icon: IconFileSearch,
    href: '/personnes',
  },

  {
    id: uniqueId(),
    title: 'Camera Configuration',
    icon: IconFileSearch,
    href: '/cameras',
  },

  // {
  //   id: uniqueId(),
  //   title: 'Flux video',
  //   icon: IconFileSearch,
  //   href: '/fluxvideo',
  // },
  

  {
    id: uniqueId(),
    title: 'GPU Camera Management',
    icon: IconFileSearch,
    href: '/processeur',
  },

  {
    id: uniqueId(),
    title: 'AI Settings',
    icon: IconFileSearch,
    href: '/iadetection',
  },

  {
    id: uniqueId(),
    title: 'Validation Images',
    icon: IconFileSearch,
    href: '/valimages',
  },


  {
    navlabel: true,
    subheader: 'Flux Video',
  },

  
  {
    id: uniqueId(),
    title: 'Flux video Youtube',
    icon: IconFileSearch,
    href: '/fluxvideotest',
  },

  {
    id: uniqueId(),
    title: 'Flux Camera IP',
    icon: IconFileSearch,
    href: '/cameraip',
  },


  
 









  // {
  //   navlabel: true,
  //   subheader: 'Vision',
  // },

  // {
  //   id: uniqueId(),
  //   title: 'Detection de Visage',
  //   icon: IconFileSearch,
  //   href: '/detectvisage',
  // },
  
  






  //Jimmy
  // {
  //   navlabel: true,
  //   subheader: 'OID Tools',
  // },

   /*
  {
    id: uniqueId(),
    title: 'Search in Live APC',
    icon: IconSearch,
    href: '/oid/live',
  },

 
  {
    id: uniqueId(),
    title: 'Search in Database',
    icon: IconSearch,
    href: '/oid/data',
  },
*/

  // {
  //   id: uniqueId(),
  //   title: 'Documentation',
  //   icon: IconFileSearch,
  //   href: '/oid/doc',
  // },





  // {
  //   navlabel: true,
  //   subheader: 'Configuration Device',
  // },

  // {
  //   id: uniqueId(),
  //   title: 'Ajouter',
  //   icon: IconSearch,
  //   href: '/manage/insert',
  // },

  /*
  {
    id: uniqueId(),
    title: 'Monitoring',
    icon: IconFileSearch,
    href: '/manage/monitoring',
  },
*/

//   {
//     navlabel: true,
//     subheader: 'Mibs',
//   },

//   {
//     id: uniqueId(),
//     title: 'Ajouter',
//     icon: IconSearch,
//     href: '/manage/mibs',
//   },
//   {
//     id: uniqueId(),
//     title: 'Ajouter OID',
//     icon: IconSearch,
//     href: '/manage/oid',
//   },

//   {
//     id: uniqueId(),
//     title: 'snmpwalk',
//     icon: IconSearch,
//     href: '/manage/walk',
//   },


//  // new
//  {
//   navlabel: true,
//   subheader: 'Réglages',
// },

// {
//   id: uniqueId(),
//   title: 'Configuration',
//   icon: IconSearch,
//   href: '/manage/configuration',
// },


// {
//   navlabel: true,
//   subheader: 'Surveillance',
// },
// {
//   id: uniqueId(),
//   title: 'Statut',
//   icon: IconSearch,
//   href: '/manage/statut-survey',
// },
// {
//   id: uniqueId(),
//   title: 'Console',
//   icon: IconSearch,
//   href: '/manage/alert-log',
// },

// {
//   id: uniqueId(),
//   title: 'Configuration',
//   icon: IconSearch,
//   href: '/manage/profil',
// },
  //JimmyEND



];

export default Menuitems;
