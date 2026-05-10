export const LOCATION_DEFAULT_IMAGES = {
  'new-york-city': '/images/trip-defaults/locations/new-york-city.png',
  'la-hollywood': '/images/trip-defaults/locations/la-hollywood.png',
  hawaii: '/images/trip-defaults/locations/hawaii.png',
  'mexico-city': '/images/trip-defaults/locations/mexico-city.png',
  'canada-niagara-falls': '/images/trip-defaults/locations/canada-niagara-falls.png',
  france: '/images/trip-defaults/locations/france.png',
  italy: '/images/trip-defaults/locations/italy.png',
  bali: '/images/trip-defaults/locations/bali.png',
  vietnam: '/images/trip-defaults/locations/vietnam.png',
  singapore: '/images/trip-defaults/locations/singapore.png',
  china: '/images/trip-defaults/locations/china.png',
  japan: '/images/trip-defaults/locations/japan.png',
  'south-korea': '/images/trip-defaults/locations/south-korea.png',
  australia: '/images/trip-defaults/locations/australia.png',
  'new-zealand': '/images/trip-defaults/locations/new-zealand.png',
  spain: '/images/trip-defaults/locations/spain.png',
  turkey: '/images/trip-defaults/locations/turkey.png',
  uk: '/images/trip-defaults/locations/uk.png',
  germany: '/images/trip-defaults/locations/germany.png',
  greece: '/images/trip-defaults/locations/greece.png',
  morocco: '/images/trip-defaults/locations/morocco.png',
  egypt: '/images/trip-defaults/locations/egypt.png',
  brazil: '/images/trip-defaults/locations/brazil.png',
  jamaica: '/images/trip-defaults/locations/jamaica.png',
  thailand: '/images/trip-defaults/locations/thailand.png',
  dubai: '/images/trip-defaults/locations/dubai.png',
  'las-vegas': '/images/trip-defaults/locations/las-vegas.png',
} as const;

export const THEME_DEFAULT_IMAGES = {
  cruise: '/images/trip-defaults/themes/cruise.png',
  beach: '/images/trip-defaults/themes/beach.png',
  skiing: '/images/trip-defaults/themes/skiing.png',
  'lush-green-jungle': '/images/trip-defaults/themes/lush-green-jungle.png',
  'mountain-region': '/images/trip-defaults/themes/mountain-region.png',
  cityscape: '/images/trip-defaults/themes/cityscape.png',
  'scuba-diving': '/images/trip-defaults/themes/scuba-diving.png',
  'wintry-tundra': '/images/trip-defaults/themes/wintry-tundra.png',
  'cultural-tourism': '/images/trip-defaults/themes/cultural-tourism.png',
  'wildlife-tourism': '/images/trip-defaults/themes/wildlife-tourism.png',
  'shopping-tourism': '/images/trip-defaults/themes/shopping-tourism.png',
  'concert-event': '/images/trip-defaults/themes/concert-event.png',
  'road-trip': '/images/trip-defaults/themes/road-trip.png',
  'yoga-retreat': '/images/trip-defaults/themes/yoga-retreat.png',
  'landscape-tourism': '/images/trip-defaults/themes/landscape-tourism.png',
  hiking: '/images/trip-defaults/themes/hiking.png',
  camping: '/images/trip-defaults/themes/camping.png',
} as const;

const LOCATION_ALIASES: Array<[RegExp, keyof typeof LOCATION_DEFAULT_IMAGES]> = [
  [/\b(new york|nyc|manhattan|brooklyn)\b/i, 'new-york-city'],
  [/\b(los angeles|hollywood|\bla\b)\b/i, 'la-hollywood'],
  [/\b(hawaii|maui|honolulu|oahu|kauai)\b/i, 'hawaii'],
  [/\b(mexico city|cdmx)\b/i, 'mexico-city'],
  [/\b(niagara|canada)\b/i, 'canada-niagara-falls'],
  [/\b(france|paris)\b/i, 'france'],
  [/\b(italy|rome|venice|florence|amalfi)\b/i, 'italy'],
  [/\b(bali)\b/i, 'bali'],
  [/\b(vietnam|hanoi|saigon|ho chi minh|ha long)\b/i, 'vietnam'],
  [/\b(singapore)\b/i, 'singapore'],
  [/\b(china|beijing|shanghai)\b/i, 'china'],
  [/\b(japan|tokyo|kyoto|osaka)\b/i, 'japan'],
  [/\b(south korea|korea|seoul)\b/i, 'south-korea'],
  [/\b(australia|sydney|melbourne)\b/i, 'australia'],
  [/\b(new zealand|queenstown|auckland)\b/i, 'new-zealand'],
  [/\b(spain|barcelona|madrid)\b/i, 'spain'],
  [/\b(turkey|istanbul|cappadocia)\b/i, 'turkey'],
  [/\b(uk|united kingdom|england|london|scotland)\b/i, 'uk'],
  [/\b(germany|berlin|munich)\b/i, 'germany'],
  [/\b(greece|athens|santorini|mykonos)\b/i, 'greece'],
  [/\b(morocco|morrocco|marrakesh|marrakech)\b/i, 'morocco'],
  [/\b(egypt|cairo|giza)\b/i, 'egypt'],
  [/\b(brazil|rio|sao paulo)\b/i, 'brazil'],
  [/\b(jamaica|kingston|montego)\b/i, 'jamaica'],
  [/\b(thailand|bangkok|phuket|chiang mai)\b/i, 'thailand'],
  [/\b(dubai|uae|emirates)\b/i, 'dubai'],
  [/\b(las vegas|vegas)\b/i, 'las-vegas'],
];

const THEME_ALIASES: Array<[RegExp, keyof typeof THEME_DEFAULT_IMAGES]> = [
  [/\b(cruise|ship|sailing)\b/i, 'cruise'],
  [/\b(beach|coast|island|surf)\b/i, 'beach'],
  [/\b(ski|skiing|snowboard)\b/i, 'skiing'],
  [/\b(jungle|rainforest|lush green)\b/i, 'lush-green-jungle'],
  [/\b(mountain|alpine|highland)\b/i, 'mountain-region'],
  [/\b(cityscape|city|urban|downtown)\b/i, 'cityscape'],
  [/\b(scuba|diving|snorkel)\b/i, 'scuba-diving'],
  [/\b(tundra|winter|wintry|arctic)\b/i, 'wintry-tundra'],
  [/\b(cultural|culture|museum|heritage)\b/i, 'cultural-tourism'],
  [/\b(wildlife|safari|animal)\b/i, 'wildlife-tourism'],
  [/\b(shopping|market|mall)\b/i, 'shopping-tourism'],
  [/\b(concert|festival|music event)\b/i, 'concert-event'],
  [/\b(road trip|drive|highway)\b/i, 'road-trip'],
  [/\b(yoga|retreat|wellness)\b/i, 'yoga-retreat'],
  [/\b(landscape|scenic|viewpoint)\b/i, 'landscape-tourism'],
  [/\b(hiking|trek|trail)\b/i, 'hiking'],
  [/\b(camping|campground|tent)\b/i, 'camping'],
];

export function getDefaultTripImage(destination?: string | null): string | undefined {
  if (!destination) return undefined;

  const locationMatch = LOCATION_ALIASES.find(([pattern]) => pattern.test(destination));
  if (locationMatch) {
    return LOCATION_DEFAULT_IMAGES[locationMatch[1]];
  }

  const themeMatch = THEME_ALIASES.find(([pattern]) => pattern.test(destination));
  if (themeMatch) {
    return THEME_DEFAULT_IMAGES[themeMatch[1]];
  }

  return undefined;
}
