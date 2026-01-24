// Kartel Vertical-Specific Content Library
// Talking points, discovery questions, and capabilities by industry vertical

export interface VerticalContent {
  value: string;
  label: string;
  description: string;
  talkingPoints: string[];
  capabilities: string[];
  discoveryQuestions: string[];
  commonPainPoints: string[];
  caseStudyHints: string[];
}

export const VERTICAL_CONTENT: Record<string, VerticalContent> = {
  Automotive: {
    value: 'Automotive',
    label: 'Automotive',
    description: 'OEMs, dealerships, and automotive marketing agencies',
    talkingPoints: [
      'Vehicle imagery at scale without expensive photo shoots',
      'Consistent brand presentation across all dealership materials',
      'Rapid turnaround for new model launches and seasonal campaigns',
      'Localized content for regional dealer networks',
      'Dynamic inventory-based creative generation',
    ],
    capabilities: [
      'Vehicle compositing and background replacement',
      'Model-specific LoRA training for brand accuracy',
      'Dealer co-op compliant creative',
      'Multi-platform asset versioning (social, OLV, CTV)',
      'Inventory feed integration for dynamic ads',
    ],
    discoveryQuestions: [
      'How many vehicle models/trims do you need to support?',
      'What\'s your current process for dealer creative requests?',
      'How do you handle new model launch creative today?',
      'What platforms are most important for your paid media?',
      'Do you have existing brand guidelines for vehicle imagery?',
    ],
    commonPainPoints: [
      'Photo shoot costs and logistics',
      'Inconsistent dealer creative quality',
      'Slow turnaround on new model assets',
      'Managing multiple trim levels and colors',
      'Maintaining brand consistency across dealer network',
    ],
    caseStudyHints: [
      'Toyota/Saatchi - enterprise automotive scale',
      'Lexus/TeamOne - premium brand consistency',
    ],
  },

  CPG: {
    value: 'CPG',
    label: 'CPG (Consumer Packaged Goods)',
    description: 'Consumer packaged goods brands and retailers',
    talkingPoints: [
      'Product imagery variations without restaging shoots',
      'Seasonal and promotional creative at scale',
      'Consistent pack shots across all retail channels',
      'Rapid iteration for A/B testing and performance',
      'Multi-SKU campaign management',
    ],
    capabilities: [
      'Product photography enhancement and compositing',
      'Pack shot standardization across SKUs',
      'Lifestyle imagery with product integration',
      'Seasonal/promotional creative templates',
      'Retailer-specific format compliance',
    ],
    discoveryQuestions: [
      'How many SKUs do you actively market?',
      'What\'s your seasonal campaign cadence?',
      'How do you currently handle retailer-specific creative?',
      'What\'s the biggest bottleneck in your creative production?',
      'Do you do a lot of promotional/sale creative?',
    ],
    commonPainPoints: [
      'SKU proliferation overwhelming creative capacity',
      'Retailer-specific requirements and formats',
      'Seasonal campaign crunch times',
      'Maintaining consistency across product lines',
      'Speed to market for new products',
    ],
    caseStudyHints: [
      'Newell/Rubbermaid - multi-brand CPG scale',
    ],
  },

  Fashion: {
    value: 'Fashion',
    label: 'Fashion',
    description: 'Fashion brands, apparel, and luxury goods',
    talkingPoints: [
      'Model imagery and styling variations at scale',
      'Seasonal collection launches with rapid turnaround',
      'Consistent brand aesthetic across all touchpoints',
      'E-commerce product imagery optimization',
      'Social-first content creation',
    ],
    capabilities: [
      'Model-based LoRA training for brand consistency',
      'Virtual styling and outfit generation',
      'Background and setting variations',
      'Size-inclusive imagery generation',
      'Social platform native content formats',
    ],
    discoveryQuestions: [
      'How many SKUs per season do you launch?',
      'What\'s your current model/photography workflow?',
      'How important is social content vs. e-commerce?',
      'Do you need diverse model representation?',
      'What\'s your brand aesthetic/mood board?',
    ],
    commonPainPoints: [
      'Photo shoot costs and scheduling',
      'Seasonal launch pressure',
      'Model diversity and representation',
      'Social content volume demands',
      'Maintaining brand aesthetic consistency',
    ],
    caseStudyHints: [
      'Marc Jacobs - luxury fashion brand',
    ],
  },

  Retail: {
    value: 'Retail',
    label: 'Retail',
    description: 'Retailers, e-commerce, and multi-brand stores',
    talkingPoints: [
      'Product catalog imagery at massive scale',
      'Promotional and sale creative automation',
      'Consistent visual merchandising across channels',
      'Localized store-specific creative',
      'Rapid response to competitive pricing',
    ],
    capabilities: [
      'Product photography standardization',
      'Promotional banner generation',
      'Category-specific creative templates',
      'Price point and offer integration',
      'Multi-channel format adaptation',
    ],
    discoveryQuestions: [
      'How many products are in your active catalog?',
      'What\'s your promotional calendar cadence?',
      'Do you need localized/store-specific creative?',
      'What e-commerce platforms do you use?',
      'How do you handle competitive price matching creative?',
    ],
    commonPainPoints: [
      'Catalog scale overwhelming creative team',
      'Promotional creative bottlenecks',
      'Inconsistent product imagery quality',
      'Speed to market for new products',
      'Managing multiple store/regional variations',
    ],
    caseStudyHints: [
      'PriceSmart - retail scale operations',
    ],
  },

  Health: {
    value: 'Health',
    label: 'Health & Wellness',
    description: 'Health, wellness, supplements, and lifestyle brands',
    talkingPoints: [
      'Compliant creative that meets regulatory requirements',
      'Lifestyle imagery that resonates with wellness audiences',
      'Subscription and DTC creative optimization',
      'Influencer-style content at scale',
      'Before/after and results-oriented creative',
    ],
    capabilities: [
      'Lifestyle and wellness imagery generation',
      'Product-in-use scenarios',
      'Testimonial-style creative formats',
      'Subscription box and packaging visualization',
      'Social proof and UGC-style content',
    ],
    discoveryQuestions: [
      'What regulatory/compliance constraints do you have?',
      'Are you DTC, retail, or both?',
      'How important is influencer/UGC-style content?',
      'What\'s your subscription vs. one-time purchase mix?',
      'Do you need before/after or results imagery?',
    ],
    commonPainPoints: [
      'Regulatory compliance on claims and imagery',
      'Creating authentic-feeling content at scale',
      'Competing with influencer content quality',
      'Subscription creative fatigue',
      'Building trust through visuals',
    ],
    caseStudyHints: [
      'Thesis - health/wellness DTC brand',
    ],
  },

  MediaTech: {
    value: 'MediaTech',
    label: 'MediaTech',
    description: 'Media, entertainment tech, and streaming platforms',
    talkingPoints: [
      'Content promotion creative at scale',
      'Personalized recommendations and thumbnails',
      'Launch campaign rapid deployment',
      'Multi-format adaptation for all platforms',
      'Talent and show-specific creative',
    ],
    capabilities: [
      'Key art variations and adaptations',
      'Thumbnail and tile image generation',
      'Launch campaign creative suites',
      'Talent-based LoRA training',
      'Platform-specific format optimization',
    ],
    discoveryQuestions: [
      'How many titles/shows do you promote monthly?',
      'What\'s your key art creation process today?',
      'Do you need talent likeness in creative?',
      'What platforms drive most of your promotion?',
      'How do you handle launch vs. evergreen content?',
    ],
    commonPainPoints: [
      'Volume of titles requiring promotion',
      'Key art approval and iteration cycles',
      'Talent likeness and approval requirements',
      'Platform format proliferation',
      'Launch crunch timelines',
    ],
    caseStudyHints: [
      'Horizon/Blu - media tech operations',
    ],
  },

  RealEstate: {
    value: 'RealEstate',
    label: 'Real Estate',
    description: 'Real estate, property management, and hospitality',
    talkingPoints: [
      'Property visualization and staging',
      'Virtual staging without physical furniture',
      'Seasonal and weather-appropriate imagery',
      'Consistent brand presentation across listings',
      'Development pre-sale visualization',
    ],
    capabilities: [
      'Virtual staging and interior design',
      'Property exterior enhancement',
      'Seasonal imagery variations',
      'Amenity and lifestyle visualization',
      'Development rendering enhancement',
    ],
    discoveryQuestions: [
      'How many properties do you market actively?',
      'Do you need virtual staging capabilities?',
      'What\'s your current photography/visualization process?',
      'Do you market developments pre-construction?',
      'What platforms do you advertise on?',
    ],
    commonPainPoints: [
      'Staging costs and logistics',
      'Weather-dependent photography',
      'Inconsistent listing imagery quality',
      'Pre-sale visualization needs',
      'Rapid turnaround for new listings',
    ],
    caseStudyHints: [
      'Woodmont - real estate operations',
      'AvantStay - hospitality/vacation rentals',
    ],
  },

  Entertainment: {
    value: 'Entertainment',
    label: 'Media/Entertainment',
    description: 'Studios, networks, and entertainment properties',
    talkingPoints: [
      'Show and talent promotional creative',
      'Key art adaptation across platforms',
      'Premiere and event marketing',
      'Franchise and IP-based creative',
      'Social engagement content',
    ],
    capabilities: [
      'Talent and character LoRA training',
      'Key art and poster generation',
      'Social content and memes',
      'Premiere and event creative',
      'Franchise-consistent creative',
    ],
    discoveryQuestions: [
      'How many shows/properties do you promote?',
      'What\'s your key art approval process?',
      'Do you need talent likeness capabilities?',
      'What social platforms are priorities?',
      'How do you handle premiere/event marketing?',
    ],
    commonPainPoints: [
      'Key art creation and approval cycles',
      'Talent availability and likeness rights',
      'Volume of promotional needs',
      'Social content velocity demands',
      'Franchise consistency requirements',
    ],
    caseStudyHints: [
      'Fox (Masked Singer) - entertainment IP',
    ],
  },
};

// Universal discovery questions that apply to all verticals
export const UNIVERSAL_DISCOVERY_QUESTIONS = {
  decisionMaking: [
    'Who else needs to be involved in this decision?',
    'What\'s your decision-making timeline?',
    'Who are the key stakeholders we should meet?',
  ],
  urgency: [
    'What\'s driving the urgency on this initiative?',
    'Is there a triggering event or deadline we should know about?',
    'What happens if this doesn\'t get solved in the next 6 months?',
  ],
  success: [
    'What would success look like if we win this deal?',
    'What KPIs would you measure us against?',
    'What are the key factors that will drive your decision?',
  ],
  operations: [
    'Where does your brand asset data currently live?',
    'What systems would we need to integrate with?',
    'Who are the day-to-day users of creative assets?',
  ],
  budget: [
    'What budget range are you working within?',
    'Is this funded or does it need to be approved?',
    'How does your fiscal year work for budgeting?',
  ],
  competition: [
    'How are you solving this problem today?',
    'Are you evaluating other solutions?',
    'What would make you choose us over alternatives?',
  ],
};

// Red flags to watch for during pre-call research
export const PRE_CALL_RED_FLAGS = [
  {
    id: 'budget_concerns',
    label: 'Budget appears under $600K',
    severity: 'critical',
    description: 'Company size or funding suggests they may not meet minimum ACV',
  },
  {
    id: 'one_off_signals',
    label: 'One-off project signals',
    severity: 'warning',
    description: 'Language suggests a single campaign rather than ongoing need',
  },
  {
    id: 'agency_intermediary',
    label: 'Agency intermediary (not direct client)',
    severity: 'warning',
    description: 'May add complexity to decision-making and budget',
  },
  {
    id: 'competitor_incumbent',
    label: 'Strong competitor incumbent',
    severity: 'warning',
    description: 'Client has existing solution that\'s working',
  },
  {
    id: 'unclear_decision_maker',
    label: 'Decision maker unclear',
    severity: 'critical',
    description: 'Contact may not have authority to make purchasing decisions',
  },
  {
    id: 'long_sales_cycle',
    label: 'Long sales cycle expected',
    severity: 'warning',
    description: 'Enterprise procurement or multiple approval layers',
  },
];

// Get content for a specific vertical
export function getVerticalContent(vertical: string): VerticalContent | null {
  return VERTICAL_CONTENT[vertical] || null;
}

// Get all verticals as array
export function getAllVerticals(): VerticalContent[] {
  return Object.values(VERTICAL_CONTENT);
}
