import type {
  EventType,
  EventFormData,
  BudgetCategory,
  TimelineMilestone,
  VendorTask,
  PersonalizedIdeas,
  PlanAssumptions,
  EventPlan,
} from '../types/event';

// Category templates with initial distribution ratios by Event Type
interface CategoryTemplate {
  name: string;
  weight: number; // percentage (0 - 100)
  description: string;
  tips: string[];
}

const WEDDING_CATEGORIES: CategoryTemplate[] = [
  {
    name: 'Venue & Reception Space',
    weight: 38,
    description: 'Rental fee, ceremony grounds, basic security, and tables/chairs if not included.',
    tips: [
      'Ask about curfew rules and cleanup fees',
      'Verify if insurance certificates are mandatory',
      'Confirm sound limits for outdoor celebrations',
    ],
  },
  {
    name: 'Catering & Bar Service',
    weight: 26,
    description: 'Hors d’oeuvres, plated/buffet dinner, signature drinks, service staff, and tableware.',
    tips: [
      'Account for vendor meals in final headcount',
      'Request tasting session 2-3 months in advance',
      'Check corkage and cake cutting fees',
    ],
  },
  {
    name: 'Photography & Videography',
    weight: 12,
    description: 'Lead photographer, second shooter, ceremony & speeches audio/video recording, editing, and photo gallery.',
    tips: [
      'Provide a shot list of family portraits',
      'Confirm golden hour photo timing with timeline',
      'Ask about turnaround time for teaser gallery',
    ],
  },
  {
    name: 'Music & Entertainment',
    weight: 8,
    description: 'Ceremony acoustic musicians, DJ/emcee, sound PA system, and dance floor lighting.',
    tips: [
      'Create a must-play and do-not-play playlist',
      'Confirm microphone setup for toasts and vows',
    ],
  },
  {
    name: 'Florals & Styling Décor',
    weight: 7,
    description: 'Bouquets, boutonnieres, ceremony arch installation, table centerpieces, and candle glow.',
    tips: [
      'Repurpose ceremony altar arrangements onto sweetheart/head table',
      'Select in-season blooms to maximize impact within budget',
    ],
  },
  {
    name: 'Stationery & Guest Favors',
    weight: 4,
    description: 'Save-the-dates, invitation suites, postage, day-of signage, place cards, and welcome favors.',
    tips: [
      'Order 10-15% extra invitation suites for keepsakes and address errors',
      'Use digital RSVPs with QR codes to save on return postage',
    ],
  },
  {
    name: 'Contingency & Incidentals',
    weight: 5,
    description: 'Emergency kit, weather backups, unexpected tips, extra transport, and last-minute additions.',
    tips: [
      'Keep untouched until final week for peace of mind',
      'Any leftover funds can be redirected to honeymoon or savings',
    ],
  },
];

const BIRTHDAY_CATEGORIES: CategoryTemplate[] = [
  {
    name: 'Food & Refreshments',
    weight: 34,
    description: 'Main feast, finger bites, mocktails/cocktails, non-alcoholic drinks, and tableware.',
    tips: [
      'Self-serve food stations minimize staffing expenses',
      'Label allergens and dietary choices clearly for guests',
    ],
  },
  {
    name: 'Venue & Space Rental',
    weight: 22,
    description: 'Private room, event loft, garden lounge, or park shelter reservation fees.',
    tips: [
      'Check setup and breakdown hours included in the rental window',
      'Inquire about parking accessibility for elderly guests',
    ],
  },
  {
    name: 'Custom Cake & Sweets',
    weight: 12,
    description: 'Bespoke celebration cake, dessert platter, cupcakes, and cake sparklers.',
    tips: [
      'Order cake 3-4 weeks ahead of peak weekend dates',
      'Ensure venue provides cooling storage prior to cake cutting',
    ],
  },
  {
    name: 'Entertainment & Activities',
    weight: 14,
    description: 'Live performer, DJ, trivia host, retro photobooth, arcade/lawn games, or workshop.',
    tips: [
      'Schedule a high-energy centerpiece activity to break the ice',
      'Prepare an awesome collaborative music playlist',
    ],
  },
  {
    name: 'Décor, Balloons & Lighting',
    weight: 10,
    description: 'Thematic photo backdrop, organic balloon garland, ambient string lights, and table accents.',
    tips: [
      'Focus décor investment on the main photo wall and cake table',
      'Use warm dimmable fairy lights to elevate ambiance after dark',
    ],
  },
  {
    name: 'Party Favors & Keepsakes',
    weight: 4,
    description: 'Personalized gift bags, polaroid photo prints, customized cookies, or takeaway treats.',
    tips: [
      'Edible or usable favors are always loved and rarely left behind',
    ],
  },
  {
    name: 'Contingency & Buffer',
    weight: 4,
    description: 'Last-minute ice runs, extra snacks, emergency adhesives, and unexpected guest plus-ones.',
    tips: [
      'Holds buffer for price fluctuations or extra orders',
    ],
  },
];

const COMMUNITY_CATEGORIES: CategoryTemplate[] = [
  {
    name: 'Permits, Insurance & City Approvals',
    weight: 18,
    description: 'Public park/street closure permits, municipal event insurance, sound permits, and fire marshal check.',
    tips: [
      'Submit municipal permit applications at least 60-90 days early',
      'Obtain certificate of liability insurance naming city as additional insured',
    ],
  },
  {
    name: 'AV Equipment, Stage & Power',
    weight: 25,
    description: 'PA audio speakers, wireless microphones, generator power distribution, cable ramps, and canopy/stage.',
    tips: [
      'Test generator wattage capacity against all amplifiers and vendor draws',
      'Have heavy-duty weather covers for sensitive sound gear',
    ],
  },
  {
    name: 'Safety, First-Aid & Sanitation',
    weight: 18,
    description: 'Portable restrooms, handwashing stations, certified first-aid station, trash/recycle bins, and security.',
    tips: [
      'Standard rule: 1 portable restroom per 75-100 attendees for events lasting 3+ hours',
      'Station volunteer green teams next to sorting stations',
    ],
  },
  {
    name: 'Hospitality & Refreshments',
    weight: 16,
    description: 'Hydration stations, snacks for attendees, volunteer meals, and food vendor coordination.',
    tips: [
      'Provide free water refill stations to promote sustainability',
      'Feed volunteers first to keep morale high throughout shifts',
    ],
  },
  {
    name: 'Signage, Wayfinding & Outreach',
    weight: 13,
    description: 'Banners, A-frame directional signs, printed schedules, flyers, social media promotion, and name badges.',
    tips: [
      'Large high-contrast directional signage is critical for accessibility',
      'Place welcome & schedule boards at all transit arrival gates',
    ],
  },
  {
    name: 'Contingency & Volunteer Recognition',
    weight: 10,
    description: 'Weather canopy tie-downs, replacement cables, volunteer appreciation gift cards, and reserve fund.',
    tips: [
      'Community events always encounter unforeseen hardware needs',
    ],
  },
];

export function generateBudgetBreakdown(eventType: EventType, totalBudget: number): BudgetCategory[] {
  const templates =
    eventType === 'wedding'
      ? WEDDING_CATEGORIES
      : eventType === 'birthday'
        ? BIRTHDAY_CATEGORIES
        : COMMUNITY_CATEGORIES;

  const validBudget = Math.max(0, Math.round(totalBudget * 100) / 100);

  // Compute raw allocations based on weights
  const categories: BudgetCategory[] = templates.map((tmpl, idx) => {
    const rawAmount = (validBudget * tmpl.weight) / 100;
    // Round to 2 decimals
    const rounded = Math.round(rawAmount * 100) / 100;
    return {
      id: `budget-cat-${idx + 1}`,
      name: tmpl.name,
      percentage: tmpl.weight,
      allocatedAmount: rounded,
      actualSpent: 0,
      description: tmpl.description,
      tips: tmpl.tips,
    };
  });

  // Calculate sum of rounded amounts
  const sumAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  const diff = Math.round((validBudget - sumAllocated) * 100) / 100;

  // Reconcile exact difference onto Contingency or first largest category
  if (diff !== 0 && categories.length > 0) {
    const contingencyIndex = categories.findIndex((c) =>
      c.name.toLowerCase().includes('contingency') || c.name.toLowerCase().includes('buffer')
    );
    const targetIndex = contingencyIndex !== -1 ? contingencyIndex : 0;
    categories[targetIndex].allocatedAmount = Math.max(
      0,
      Math.round((categories[targetIndex].allocatedAmount + diff) * 100) / 100
    );
  }

  // Recalculate exact displayed percentage share
  if (validBudget > 0) {
    categories.forEach((cat) => {
      cat.percentage = Math.round((cat.allocatedAmount / validBudget) * 1000) / 10;
    });
  }

  return categories;
}

// Generate Date-Aware Timeline Milestones
export function generateTimeline(eventDateStr: string, eventType: EventType): TimelineMilestone[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Timezone-safe local date parsing
  const parts = eventDateStr.split('-').map(Number);
  const eventDate = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
    : new Date(eventDateStr);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - now.getTime();
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isPast = totalDays < 0;

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const addDays = (base: Date, days: number): Date => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Build tailored phases based on event lead time
  interface PhaseSpec {
    phase: string;
    title: string;
    daysBeforeEvent: number;
    timeframeDescription: string;
    tasks: string[];
  }

  let phaseSpecs: PhaseSpec[] = [];

  if (eventType === 'wedding') {
    phaseSpecs = [
      {
        phase: 'Vision & Big Anchors',
        title: 'Establish Budget, Date & Core Team',
        daysBeforeEvent: Math.min(270, Math.max(30, Math.floor(totalDays * 0.85))),
        timeframeDescription: totalDays > 180 ? '9 - 12 Months Before' : 'Early Phase',
        tasks: [
          'Align on priority checklist and guest headcount cap',
          'Lock in ceremony and reception venue dates',
          'Hire lead wedding planner or day-of coordinator',
          'Book high-demand photographer & videographer',
        ],
      },
      {
        phase: 'Guest Experience & Styling',
        title: 'Catering, Attire & Visual Aesthetic',
        daysBeforeEvent: Math.min(180, Math.max(20, Math.floor(totalDays * 0.6))),
        timeframeDescription: totalDays > 180 ? '6 - 8 Months Before' : 'Midway Milestones',
        tasks: [
          'Send Save-the-Date notices to all out-of-town guests',
          'Conduct menu tasting and finalize bar service package',
          'Select wedding party attire and initial wardrobe fittings',
          'Book ceremony musicians, DJ, or live reception band',
          'Design floral palette and tablescape rental requirements',
        ],
      },
      {
        phase: 'Details & Invitations',
        title: 'Stationery, Hair/Makeup & Registry',
        daysBeforeEvent: Math.min(90, Math.max(14, Math.floor(totalDays * 0.35))),
        timeframeDescription: totalDays > 90 ? '3 - 4 Months Before' : 'Fine-Tuning',
        tasks: [
          'Mail official formal wedding invitation suites with RSVP deadline',
          'Schedule hair and makeup trial with hairpiece/veil',
          'Order wedding bands and arrange engraving',
          'Finalize ceremony order of service and select readings',
        ],
      },
      {
        phase: 'Final Logistics',
        title: 'RSVP Headcounts & Seating Chart',
        daysBeforeEvent: Math.min(30, Math.max(7, Math.floor(totalDays * 0.15))),
        timeframeDescription: '1 Month Before',
        tasks: [
          'Follow up with pending RSVPs and freeze caterer final headcount',
          'Draft reception seating chart and place cards',
          'Apply for official marriage license according to local legal window',
          'Confirm day-of timeline rundown with all vendors and emcee',
        ],
      },
      {
        phase: 'Rehearsal & Eve',
        title: 'Walk-Through & Pack Emergency Kit',
        daysBeforeEvent: 2,
        timeframeDescription: '2 - 3 Days Before',
        tasks: [
          'Conduct ceremony rehearsal walk-through with wedding party',
          'Hand off vendor tip envelopes and day-of emergency kits to coordinator',
          'Steam dresses, press suits, and pack overnight luggage',
        ],
      },
      {
        phase: 'The Celebration',
        title: 'Wedding Day Execution',
        daysBeforeEvent: 0,
        timeframeDescription: 'Event Day',
        tasks: [
          'Eat a hearty morning breakfast and stay hydrated',
          'Entrust ceremony rings and documents to best person/maid of honor',
          'Soak in the love and celebrate every single magical moment!',
        ],
      },
    ];
  } else if (eventType === 'birthday') {
    phaseSpecs = [
      {
        phase: 'Concept & Invitations',
        title: 'Theme, Venue & Guest List',
        daysBeforeEvent: Math.min(60, Math.max(21, Math.floor(totalDays * 0.75))),
        timeframeDescription: '4 - 6 Weeks Before',
        tasks: [
          'Pick vibrant theme or color dress code',
          'Reserve party venue or prep host home/patio space',
          'Send digital or paper invitations with clear RSVP date',
          'Book DJ, entertainer, or interactive activity host',
        ],
      },
      {
        phase: 'Food & Showpieces',
        title: 'Custom Cake, Drinks & Entertainment',
        daysBeforeEvent: Math.min(21, Math.max(10, Math.floor(totalDays * 0.4))),
        timeframeDescription: '2 - 3 Weeks Before',
        tasks: [
          'Order showstopper celebration cake and specialty treats',
          'Curate party playlist featuring guest of honor’s favorite songs',
          'Order balloon installations, banners, and photo backdrop props',
          'Plan party games, trivia rounds, or toast lineup',
        ],
      },
      {
        phase: 'Final Prep & Shopping',
        title: 'Confirm Numbers & Supplies',
        daysBeforeEvent: Math.min(7, Math.max(3, Math.floor(totalDays * 0.15))),
        timeframeDescription: '1 Week Before',
        tasks: [
          'Lock in guest headcount and purchase drink supplies & bar mixers',
          'Assemble guest favor gift bags or takeaway treats',
          'Charge camera batteries, speaker gear, and party lighting',
        ],
      },
      {
        phase: 'Eve Setup',
        title: 'Staging & Chilling',
        daysBeforeEvent: 1,
        timeframeDescription: 'Day Before',
        tasks: [
          'Inflate balloon arches and hang feature banners',
          'Pre-chill all beverages, wine, and prepare ice coolers',
          'Pick up cake or confirm scheduled delivery arrival window',
        ],
      },
      {
        phase: 'Party Time',
        title: 'Celebrate and Make Memories',
        daysBeforeEvent: 0,
        timeframeDescription: 'Party Day',
        tasks: [
          'Set up welcome table and photo area',
          'Light birthday candles and lead celebratory toast',
          'Capture high-res group photos before the feast!',
        ],
      },
    ];
  } else {
    // Community Event
    phaseSpecs = [
      {
        phase: 'Permits & Approvals',
        title: 'City Clearances, Safety & Committee',
        daysBeforeEvent: Math.min(90, Math.max(30, Math.floor(totalDays * 0.8))),
        timeframeDescription: '2 - 3 Months Before',
        tasks: [
          'Submit park, street closure, and amplified sound permit paperwork',
          'Secure general event liability insurance policy',
          'Convene volunteer committee and assign leads for safety, staging, and welcome',
          'Reach out to local sponsors, neighborhood associations, and food trucks',
        ],
      },
      {
        phase: 'Staging & Vendors',
        title: 'AV Rental, Restrooms & Publicity',
        daysBeforeEvent: Math.min(45, Math.max(14, Math.floor(totalDays * 0.5))),
        timeframeDescription: '4 - 6 Weeks Before',
        tasks: [
          'Book sound PA engineer, microphones, and canopy shade tents',
          'Reserve portable restrooms, ADA-accessible units, and handwash sinks',
          'Distribute flyers, post neighborhood notices, and launch community social campaign',
          'Confirm food vendor health department operating certifications',
        ],
      },
      {
        phase: 'Volunteers & Run-of-Show',
        title: 'Volunteer Briefing & Schedule',
        daysBeforeEvent: Math.min(14, Math.max(5, Math.floor(totalDays * 0.2))),
        timeframeDescription: '1 - 2 Weeks Before',
        tasks: [
          'Publish volunteer shift roster (setup, registration, waste monitor, teardown)',
          'Print large directional signage, emergency exits, and event schedule boards',
          'Stock first-aid kit and organize lost-and-found station supplies',
        ],
      },
      {
        phase: 'Eve Site Walk',
        title: 'Equipment Drop & Power Check',
        daysBeforeEvent: 1,
        timeframeDescription: 'Day Before',
        tasks: [
          'Walk event site with lead safety marshal and mark vendor stalls',
          'Test generator wattage and sound cable runs with safety ramps',
          'Send reminder text to all volunteer team leads',
        ],
      },
      {
        phase: 'Community Gathering',
        title: 'Live Event Execution & Clean Up',
        daysBeforeEvent: 0,
        timeframeDescription: 'Event Day',
        tasks: [
          'Open volunteer check-in and hand out high-visibility lanyards',
          'Host opening address and keep stage schedule punctual',
          'Execute post-event sweep and leave venue pristine',
        ],
      },
    ];
  }

  return phaseSpecs.map((spec, idx) => {
    // Target date calculated backwards from eventDate
    const targetDateObj = addDays(eventDate, -spec.daysBeforeEvent);
    const targetDateStr = formatDate(targetDateObj);

    const diffFromNow = Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isPastDue = diffFromNow < 0;

    let status: 'pending' | 'in-progress' | 'completed' = 'pending';
    if (isPastDue) {
      status = 'in-progress';
    }

    return {
      id: `milestone-${idx + 1}`,
      phase: spec.phase,
      title: spec.title,
      targetDate: targetDateStr,
      daysFromNow: diffFromNow,
      isPastDue: !isPast && isPastDue,
      timeframeDescription: spec.timeframeDescription,
      status,
      tasks: spec.tasks.map((t, taskIdx) => ({
        id: `m-task-${idx + 1}-${taskIdx + 1}`,
        text: t,
        completed: false,
      })),
    };
  });
}

// Generate Tailored Vendor Checklist
export function generateVendorChecklist(
  eventType: EventType,
  totalBudget: number,
  eventDateStr: string
): VendorTask[] {
  const parts = eventDateStr.split('-').map(Number);
  const eventDate = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
    : new Date(eventDateStr);
  eventDate.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const targetDateForDaysBefore = (daysBefore: number): string => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() - daysBefore);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  interface VendorItemTemplate {
    category: string;
    title: string;
    budgetShare: number; // percentage of total budget
    daysBefore: number;
    priority: 'high' | 'medium' | 'low';
    notes: string;
  }

  let templates: VendorItemTemplate[] = [];

  if (eventType === 'wedding') {
    templates = [
      {
        category: 'Venue & Reception',
        title: 'Ceremony & Reception Venue Booking',
        budgetShare: 0.35,
        daysBefore: Math.min(270, Math.max(30, Math.floor(daysUntil * 0.85))),
        priority: 'high',
        notes: 'Confirm contract includes tables, chairs, cleanup policy, and insurance requirements.',
      },
      {
        category: 'Catering & Dining',
        title: 'Full-Service Caterer & Bar Staff',
        budgetShare: 0.25,
        daysBefore: Math.min(180, Math.max(25, Math.floor(daysUntil * 0.65))),
        priority: 'high',
        notes: 'Includes appetizers, main dinner, bar staffing, glassware, and vendor meals.',
      },
      {
        category: 'Photography & Media',
        title: 'Lead Wedding Photographer & Second Shooter',
        budgetShare: 0.11,
        daysBefore: Math.min(210, Math.max(20, Math.floor(daysUntil * 0.7))),
        priority: 'high',
        notes: 'Full 8-hour coverage, engagement shoot, high-res edited digital gallery rights.',
      },
      {
        category: 'Music & Audio',
        title: 'DJ & MC Entertainment with Sound Rig',
        budgetShare: 0.07,
        daysBefore: Math.min(120, Math.max(15, Math.floor(daysUntil * 0.5))),
        priority: 'medium',
        notes: 'Wireless lapel microphones for ceremony vows and reception toasts included.',
      },
      {
        category: 'Florals & Styling',
        title: 'Floral Designer for Arch & Centerpieces',
        budgetShare: 0.06,
        daysBefore: Math.min(90, Math.max(14, Math.floor(daysUntil * 0.4))),
        priority: 'medium',
        notes: 'Bridal bouquet, boutonnieres, ceremony backdrop arch, and 10 table centerpieces.',
      },
      {
        category: 'Attire & Beauty',
        title: 'Bridal Hair & Makeup Stylist Team',
        budgetShare: 0.04,
        daysBefore: Math.min(75, Math.max(10, Math.floor(daysUntil * 0.3))),
        priority: 'medium',
        notes: 'Includes trial run 4 weeks ahead plus day-of on-site styling for wedding party.',
      },
      {
        category: 'Bakery & Sweets',
        title: 'Artisan Wedding Cake & Dessert Table',
        budgetShare: 0.03,
        daysBefore: Math.min(60, Math.max(10, Math.floor(daysUntil * 0.25))),
        priority: 'medium',
        notes: 'Three-tier cutting cake plus assorted dessert minis (macarons, tartlets).',
      },
      {
        category: 'Stationery & Print',
        title: 'Invitation Suite & Signage Printing',
        budgetShare: 0.03,
        daysBefore: Math.min(100, Math.max(14, Math.floor(daysUntil * 0.45))),
        priority: 'low',
        notes: 'Foil-pressed invitations, welcome easel sign, table numbers, and place cards.',
      },
      {
        category: 'Coordination',
        title: 'Day-of Event Coordinator',
        budgetShare: 0.06,
        daysBefore: Math.min(150, Math.max(14, Math.floor(daysUntil * 0.6))),
        priority: 'high',
        notes: 'Takes over vendor communications 4 weeks out and orchestrates seamless day-of flow.',
      },
    ];
  } else if (eventType === 'birthday') {
    templates = [
      {
        category: 'Space & Venue',
        title: 'Party Room / Lounge Space Rental',
        budgetShare: 0.22,
        daysBefore: Math.min(45, Math.max(15, Math.floor(daysUntil * 0.7))),
        priority: 'high',
        notes: 'Accommodates guest seating, dance area, and includes trash cleanup service.',
      },
      {
        category: 'Food & Beverage',
        title: 'Party Catering / Food Station Service',
        budgetShare: 0.32,
        daysBefore: Math.min(30, Math.max(10, Math.floor(daysUntil * 0.5))),
        priority: 'high',
        notes: 'Hot sliders, savory grazing board, skewers, and signature punch cocktail setup.',
      },
      {
        category: 'Custom Bakery',
        title: 'Themed Birthday Cake Baker',
        budgetShare: 0.1,
        daysBefore: Math.min(25, Math.max(8, Math.floor(daysUntil * 0.4))),
        priority: 'high',
        notes: 'Custom designer tiered cake with custom message topper and sparkler candles.',
      },
      {
        category: 'Entertainment',
        title: 'DJ / Live Performer or Interactive Host',
        budgetShare: 0.14,
        daysBefore: Math.min(30, Math.max(10, Math.floor(daysUntil * 0.5))),
        priority: 'medium',
        notes: 'Provides lively sound, manages music requests, and announces birthday toast.',
      },
      {
        category: 'Décor & Visuals',
        title: 'Balloon Artist & Feature Photo Wall',
        budgetShare: 0.1,
        daysBefore: Math.min(20, Math.max(7, Math.floor(daysUntil * 0.35))),
        priority: 'medium',
        notes: 'Organic balloon garland frame with shimmer backdrop and neon birthday sign.',
      },
      {
        category: 'Photography',
        title: 'Event Photographer / Instant Print Booth',
        budgetShare: 0.08,
        daysBefore: Math.min(25, Math.max(7, Math.floor(daysUntil * 0.4))),
        priority: 'low',
        notes: 'Captures candid guest moments, cake cutting, and group portrait keepsakes.',
      },
      {
        category: 'Favors & Print',
        title: 'Personalized Guest Favors & Signage',
        budgetShare: 0.04,
        daysBefore: Math.min(14, Math.max(5, Math.floor(daysUntil * 0.2))),
        priority: 'low',
        notes: 'Custom souvenir cups, favor bags, or gourmet takeaway cookies.',
      },
    ];
  } else {
    // Community Event
    templates = [
      {
        category: 'Permits & Municipal',
        title: 'City Parks / Street Closure Permit Office',
        budgetShare: 0.14,
        daysBefore: Math.min(75, Math.max(25, Math.floor(daysUntil * 0.8))),
        priority: 'high',
        notes: 'File right-of-way usage, amplified noise permit, and fire inspection clearances.',
      },
      {
        category: 'Insurance',
        title: 'Event Liability Insurance Carrier',
        budgetShare: 0.06,
        daysBefore: Math.min(60, Math.max(20, Math.floor(daysUntil * 0.7))),
        priority: 'high',
        notes: 'Comprehensive 1M/2M general liability certificate naming city municipality.',
      },
      {
        category: 'Audio & Staging',
        title: 'Stage, Tent Canopy & Sound Production Rig',
        budgetShare: 0.25,
        daysBefore: Math.min(50, Math.max(15, Math.floor(daysUntil * 0.6))),
        priority: 'high',
        notes: 'Outdoor rated PA speakers, dual wireless mics, power generator, and technician.',
      },
      {
        category: 'Sanitation & Health',
        title: 'Portable Restrooms & Handwash Stations',
        budgetShare: 0.16,
        daysBefore: Math.min(45, Math.max(14, Math.floor(daysUntil * 0.55))),
        priority: 'high',
        notes: 'Standard units plus ADA wheelchair accessible restroom and scheduled servicing.',
      },
      {
        category: 'Waste Management',
        title: 'Trash, Recycling & Dumpster Rentals',
        budgetShare: 0.08,
        daysBefore: Math.min(30, Math.max(10, Math.floor(daysUntil * 0.4))),
        priority: 'medium',
        notes: 'Dual sorting stations with clearly labeled signage throughout festival grounds.',
      },
      {
        category: 'Signage & Marketing',
        title: 'Wayfinding Banners & Community Posters',
        budgetShare: 0.1,
        daysBefore: Math.min(30, Math.max(10, Math.floor(daysUntil * 0.4))),
        priority: 'medium',
        notes: 'Large vinyl entrance banner, sponsor acknowledgment board, and map placards.',
      },
      {
        category: 'Hospitality',
        title: 'Bulk Hydration & Volunteer Refreshments',
        budgetShare: 0.12,
        daysBefore: Math.min(20, Math.max(7, Math.floor(daysUntil * 0.25))),
        priority: 'medium',
        notes: 'Free filtered water cooler barrels, fruit, sandwich boxes, and electrolyte drinks.',
      },
      {
        category: 'Safety & Security',
        title: 'On-Site First-Aid & Crowd Safety Monitor',
        budgetShare: 0.09,
        daysBefore: Math.min(40, Math.max(12, Math.floor(daysUntil * 0.5))),
        priority: 'high',
        notes: 'Designated first-aid shade tent with AED device and licensed volunteer nurse.',
      },
    ];
  }

  return templates.map((tmpl, idx) => {
    const rawCost = totalBudget * tmpl.budgetShare;
    const estimatedCost = Math.round(rawCost);
    return {
      id: `vendor-${idx + 1}`,
      category: tmpl.category,
      title: tmpl.title,
      estimatedCost,
      dueDate: targetDateForDaysBefore(tmpl.daysBefore),
      status: 'pending',
      priority: tmpl.priority,
      notes: tmpl.notes,
    };
  });
}

// Generate Personalized Ideas Tailored to Inputs
export function generatePersonalizedIdeas(inputs: EventFormData): PersonalizedIdeas {
  const { eventType, themeStyle, priorities, dietaryAccessibility } = inputs;

  const styleContext = themeStyle ? `"${themeStyle}"` : 'celebratory and welcoming';

  let themeAndAtmosphere: string[] = [];
  let foodAndBeverage: string[] = [];
  let activitiesAndMoments: string[] = [];
  let decorAndDetails: string[] = [];
  let guestExperience: string[] = [];

  if (eventType === 'wedding') {
    themeAndAtmosphere = [
      `Signature Aesthetic: Weave a romantic ${styleContext} palette with warm candlelight, organic greenery, and gold or brass accents.`,
      `Acoustic Prelude: Welcome arriving guests with fingerpicked acoustic guitar or classical strings playing modern love ballads.`,
      `Sunset Transition: Program dynamic lighting to shift from soft warm amber during dinner to energetic club glow when the dance floor opens.`,
    ];

    foodAndBeverage = [
      `Interactive Cocktail Hour: Pair custom 'His & Hers' signature cocktails with seasonal bite-sized hors d'oeuvres reflecting regional favorites.`,
      dietaryAccessibility
        ? `Thoughtful Dietary Accommodations: Dedicated plated alternatives for guests (${dietaryAccessibility}) prepared with clear kitchen allergen protocol.`
        : `Allergen-Conscious Comfort: Clearly signposted gluten-free, vegan, and nut-safe appetizer selections so everyone indulges freely.`,
      `Late-Night Revival Snack: Pass gourmet mini sliders, truffle fries, or warm churro bites at 10 PM to keep dance floor energy roaring.`,
    ];

    activitiesAndMoments = [
      `Audio Guestbook Booth: Set up a vintage rotary phone where loved ones leave heartfelt audio voicemails after the ceremony.`,
      `Golden Hour Photo Break: Sneak away with the photographer for 15 private minutes at sunset for magical, relaxed portrait light.`,
      `Private Last Dance: Clear the ballroom before the grand exit so the couple shares one intimate final song together undisturbed.`,
    ];

    decorAndDetails = [
      `Statement Ceremony Altar: An asymmetrical organic arch designed to be seamlessly repurposed behind the reception sweetheart table.`,
      `Tactile Table Settings: Textured linen napkins, custom calligraphed deckle-edge menu cards, and flickering amber tea lights.`,
      `Personalized Memory Gallery: A tastefully framed photo timeline highlighting pivotal dating milestones and childhood smiles.`,
    ];

    guestExperience = [
      `Welcome Refreshment Station: Greet guests with chilled lavender lemonade or sparkling prosecco as they arrive before the ceremony seating.`,
      `Heel Rescue & Comfort: A curated basket of soft disposable dance slippers, blister cushions, and emergency mini spritzers.`,
      `Interactive Favor Keepsake: A live watercolor sketch artist painting mini guest portraits or custom seed packets to plant at home.`,
    ];
  } else if (eventType === 'birthday') {
    themeAndAtmosphere = [
      `Vibrant Aesthetic: Center the party around a punchy ${styleContext} vibe with festive neon signage and curated color dress code.`,
      `Surprise Arrival Entrance: Create a high-energy entrance tunnel with upbeat walk-in music and confetti poppers for the guest of honor.`,
      `Lounge Chill Zone: Arrange velvet poufs and floor pillows away from the main speakers for friends who want relaxed conversation.`,
    ];

    foodAndBeverage = [
      `Elevated Grazing Feast: A sweeping artisanal charcuterie & mezze table piled with fresh figs, dips, honeycomb, and warm pita.`,
      `DIY Mocktail & Cocktail Bar: Infused syrups (blackberry thyme, spicy mango), sparkling tonics, and garnishes for bespoke custom sips.`,
      `Showstopper Dessert Moment: Sparkler-topped signature birthday cake flanked by mini dessert shooters (lemon meringue, tiramisu).`,
    ];

    activitiesAndMoments = [
      `Crowd Trivia / 'Roast & Toast': A short, hilarious 15-minute trivia game about the birthday person hosted via mobile buzzer or funny cue cards.`,
      `Retro Polaroid Memory Board: Guests snap vintage film photos, pin them to an illuminated wire grid, and write birthday wishes in metallic ink.`,
      `Custom Dance Playlist Roulette: Let guests submit song requests with their RSVP to guarantee their favorite throwback jam gets played.`,
    ];

    decorAndDetails = [
      `Dimensional Balloon Sculpture: A modern organic matte balloon garland framing a customized glowing LED neon birthday sign.`,
      `Nostalgic Photo Garland: Fun throwback photos of the celebrant from baby years to today hung along the bar or entrance corridor.`,
      `Glitter Bar / Fun Accessories: Festive sunglasses, temporary metallic flash tattoos, or light-up rings for midnight dancing.`,
    ];

    guestExperience = [
      `Personalized Welcome Token: Custom acrylic or wooden drink tags engraved with each guest’s name that double as party keepsakes.`,
      `Hangover / Recovery Kit: Miniature favor pouches containing hydration electrolyte packets, mints, and gourmet midnight cookies.`,
      dietaryAccessibility
        ? `Customized Menu Cards: Transparent dietary markings honoring guest needs (${dietaryAccessibility}).`
        : `Accessible Seating: Ample seating options ensuring guests of all stamina levels stay comfortable and engaged.`,
    ];
  } else {
    // Community Event
    themeAndAtmosphere = [
      `Open & Welcoming Layout: Design an intuitive loop with generous walking lanes, family-friendly rest stops, and high-visibility info hubs.`,
      `Community Voice Stage: A dedicated open mic and acoustic stage showcasing local neighborhood talents, schools, and cultural performers.`,
      `Eco-Friendly Festivities: Zero-waste sorting ambassadors and compostable foodware across all community vendor stalls.`,
    ];

    foodAndBeverage = [
      `Neighborhood Food Truck Rally: Curated local food partners representing multicultural culinary traditions (tacos, bao, crepes, samosas).`,
      `Free Hydration Station: Accessible chilled water bottle refill stations encouraging attendees to bring reusable canteens.`,
      dietaryAccessibility
        ? `Broad Food Inclusivity: Strict adherence to diverse dietary and accessibility needs (${dietaryAccessibility}).`
        : `Family-Friendly Affordability: Cap vendor pricing on children’s snack bundles so all neighborhood families can participate comfortably.`,
    ];

    activitiesAndMoments = [
      `Collaborative Community Mural: A giant canvas banner where attendees of all ages paint their neighborhood memories and future hopes.`,
      `Lawn Games & Obstacle Course: Giant Jenga, cornhole tournaments, sack races, and chalk art competitions for youngsters.`,
      `Raffle & Community Hero Award: A brief 20-minute midday ceremony honoring inspiring neighborhood volunteers and giving away local business vouchers.`,
    ];

    decorAndDetails = [
      `High-Contrast Wayfinding: Colorful branded pennant bunting guiding foot traffic between activities, restrooms, and first aid.`,
      `Shade Canopy Pavilions: Clustered sun canopies equipped with misting fans to protect guests during warm afternoon hours.`,
      `History & Storytelling Panels: An engaging outdoor photo exhibition displaying archival neighborhood history and local landmarks.`,
    ];

    guestExperience = [
      `Full ADA Accessibility: Clear ramps over lawn cables, designated wheelchair viewing zones at main stage, and accessible family restrooms.`,
      `Volunteer Welcome Ambassadors: Friendly greeters in bright branded tees providing printed schedules, lost-child wristbands, and smiles.`,
      `Community Resource Hub: A quiet corner booth where local public libraries, gardening clubs, and mutual aid groups share free resources.`,
    ];
  }

  // Factor in user priorities if provided
  if (priorities) {
    activitiesAndMoments.unshift(
      `Priority Focus (${priorities}): Every schedule milestone and budget dollar is calibrated to spotlight your stated priority: "${priorities}".`
    );
  }

  return {
    themeAndAtmosphere,
    foodAndBeverage,
    activitiesAndMoments,
    decorAndDetails,
    guestExperience,
  };
}

// Generate Assumptions and Actionable Next Steps
export function generateAssumptions(inputs: EventFormData): PlanAssumptions {
  const assumptions: string[] = [];
  const nextSteps: string[] = [];

  const { eventType, location, guestCount, dietaryAccessibility, themeStyle } = inputs;

  // Derive realistic assumptions based on input completeness
  if (!location || location.toLowerCase().includes('tbd') || location.toLowerCase().includes('undecided')) {
    assumptions.push('Venue: Costs assume a rented event space requiring separate equipment and catering setup.');
    nextSteps.push('Shortlist 3 candidate venues and schedule in-person site walk-throughs within the next 14 days.');
  } else {
    assumptions.push(`Venue Location: Calculations assume an event hosted in or near "${location}".`);
    nextSteps.push(`Request formal facility rental rules, loading dock hours, and curfew limitations for "${location}".`);
  }

  if (eventType === 'wedding') {
    assumptions.push(`Guest Scale: Estimated at ~${guestCount} attendees with an anticipated ~80% RSVP acceptance rate.`);
    assumptions.push('Catering: Model assumes a buffet or dual-entrée plated dinner with a 4-hour open bar service.');
    nextSteps.push('Finalize your ceremony officiant and check regional marriage license wait periods.');
    nextSteps.push('Lock in your top 2 priority vendors (Venue and Photographer) before peak dates book up.');
  } else if (eventType === 'birthday') {
    assumptions.push(`Guest Scale: Estimated at ~${guestCount} guests with heavy concentration around an evening party window.`);
    assumptions.push('Drinks & Food: Model assumes casual grazing food stations with beer, wine, mocktails, and cake.');
    nextSteps.push('Send digital calendar invites with a concrete RSVP deadline 2 weeks before the party.');
    nextSteps.push('Share theme moodboard with your baker and balloon artist to lock in color swatches.');
  } else {
    assumptions.push(`Community Footprint: Planned for ~${guestCount} peak attendees over a multi-hour open window.`);
    assumptions.push('Permits: Assumes municipal approval is required for public property usage, sound, and sanitation.');
    nextSteps.push('Schedule a pre-application check with the municipal parks or permitting department immediately.');
    nextSteps.push('Hold a volunteer committee kickoff meeting to assign security, stage, and cleanup coordinators.');
  }

  if (!dietaryAccessibility) {
    assumptions.push('Dietary: Assumes standard menu with standard vegetarian options. Special dietary notes can be updated anytime.');
    nextSteps.push('Add a dietary restriction inquiry field to your RSVP cards to capture allergy needs.');
  } else {
    assumptions.push(`Special Needs: Plan explicitly accounts for stated needs: "${dietaryAccessibility}".`);
    nextSteps.push(`Provide caterer with exact written numbers for requested accommodations (${dietaryAccessibility}).`);
  }

  if (!themeStyle) {
    assumptions.push('Aesthetic: Assumes modern celebratory styling. You can customize colors and motifs as your vision evolves.');
  }

  return {
    assumptions,
    nextSteps,
  };
}

// Master Plan Generation Orchestrator
export function generateEventPlan(inputs: EventFormData, engineMode: 'deterministic' | 'ai' = 'deterministic'): EventPlan {
  const budgetBreakdown = generateBudgetBreakdown(inputs.eventType, inputs.totalBudget);
  const timeline = generateTimeline(inputs.date, inputs.eventType);
  const vendorChecklist = generateVendorChecklist(inputs.eventType, inputs.totalBudget, inputs.date);
  const ideas = generatePersonalizedIdeas(inputs);
  const assumptions = generateAssumptions(inputs);

  const nowIso = new Date().toISOString();

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    inputs: { ...inputs },
    budgetBreakdown,
    timeline,
    vendorChecklist,
    ideas,
    assumptions,
    engineMode,
    isSample: false,
  };
}
