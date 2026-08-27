const fs = require('fs');
let content = fs.readFileSync('src/components/marketing/ProductOptimizer.tsx', 'utf8');

const newContent = `  const [isOptimizing, setIsOptimizing] = useState(false);  const [isSaving, setIsSaving] = useState(false);  const [optimized, setOptimized] = useState(false);  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [originalProduct, setOriginalProduct] = useState<any>(null);  const [seoResult, setSeoResult] = useState<any>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products on mount and when typing
  useEffect(() => {
    const fetchProducts = async () => {
      setIsSearchingProducts(true);
      try {
        const response = await axios.get('/api/marketing/products', {
          params: { q: searchTerm }
        });
        setProducts(response.data);
      } catch (err) {
        console.error("Erro ao buscar produtos", err);
      } finally {
        setIsSearchingProducts(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 400); // Debounce
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
`;

content = content.replace("  const [isOptimizing, setIsOptimizing] = useState(false);  const [isSaving, setIsSaving] = useState(false);  const [optimized, setOptimized] = useState(false);  const [searchTerm, setSearchTerm] = useState('FACA DE ACO INOXIDAVEL C/ CABO PLASTICO 12');  const [originalProduct, setOriginalProduct] = useState<any>(null);  const [seoResult, setSeoResult] = useState<any>(null);", newContent);

fs.writeFileSync('src/components/marketing/ProductOptimizer.tsx', content);
