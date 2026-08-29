import fs from 'fs';

let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

// 1. Change default interval to 5 min
content = content.replace(
  'const [autoPilotInterval, setAutoPilotInterval] = useState<number>(0.5);',
  'const [autoPilotInterval, setAutoPilotInterval] = useState<number>(5);'
);
content = content.replace(
  'const autoPilotIntervalRef = useRef<number>(0.5);',
  'const autoPilotIntervalRef = useRef<number>(5);'
);

// 2. Add SEO filter states
const filterStates = `  const [seoFiltersEnabled, setSeoFiltersEnabled] = useState(false);
  const seoFiltersEnabledRef = useRef(false);
  const [seoScoreMin, setSeoScoreMin] = useState<number>(0);
  const seoScoreMinRef = useRef<number>(0);
  const [seoScoreMax, setSeoScoreMax] = useState<number>(100);
  const seoScoreMaxRef = useRef<number>(100);
  const [ignoreKits, setIgnoreKits] = useState(false);
  const ignoreKitsRef = useRef(false);
  const [ignoreAlteredCondition, setIgnoreAlteredCondition] = useState<'less' | 'more'>('less');
  const ignoreAlteredConditionRef = useRef<'less' | 'more'>('less');
  const [ignoreAlteredDays, setIgnoreAlteredDays] = useState<number>(7);
  const ignoreAlteredDaysRef = useRef<number>(7);
  
  // Persist filters to API so the server knows about them
  useEffect(() => {
    axios.post('/api/marketing/seo-filters', {
      enabled: seoFiltersEnabled,
      min: seoScoreMin,
      max: seoScoreMax,
      ignoreKits: ignoreKits,
      alteredCondition: ignoreAlteredCondition,
      alteredDays: ignoreAlteredDays
    }).catch(console.error);
  }, [seoFiltersEnabled, seoScoreMin, seoScoreMax, ignoreKits, ignoreAlteredCondition, ignoreAlteredDays]);
`;

content = content.replace('  const isInitialMount = useRef(true);', filterStates + '\n  const isInitialMount = useRef(true);');

// 3. Make AutoPilot options always visible
content = content.replace('{autoPilot && (\n            <>', '<>\n            <div className="flex flex-col md:flex-row gap-4 mt-2">');

content = content.replace('</>\n          )}', '</div>\n          </>');

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content, 'utf8');
