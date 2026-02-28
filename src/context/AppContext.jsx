import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import {
    defaultVillageInfo,
    bidangStructure,
} from '../data/sampleData';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const THEME_KEY = 'lpj-desa-theme';

// Build initial subBidang state from the bidangStructure definition
function buildInitialSubBidang() {
    const result = {};
    Object.entries(bidangStructure).forEach(([bidang, config]) => {
        result[bidang] = config.subBidang.map((sb, idx) => ({
            id: idx + 1,
            nama: typeof sb === 'string' ? sb : sb.nama,
            norek: typeof sb === 'string' ? '' : (sb.norek || ''),
        }));
    });
    return result;
}

function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
        return 'light';
    }
}

// Area 4: Supabase as single source of truth (localStorage disabled for primary data)
const initialState = {
    villageInfo: defaultVillageInfo,
    incomes: [],
    expenses: [],
    pembiayaan: [],
    activities: [],
    subBidang: buildInitialSubBidang(),
    lpjNarratives: {},
    expenseItems: [],
};

function generateId(items) {
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function reducer(state, action) {
    switch (action.type) {
        case 'SET_VILLAGE_INFO':
            return { ...state, villageInfo: action.payload };

        case 'SET_INCOMES':
            return { ...state, incomes: action.payload };

        case 'ADD_INCOME':
            return { ...state, incomes: [...state.incomes, { ...action.payload, id: generateId(state.incomes) }] };
        case 'UPDATE_INCOME':
            return { ...state, incomes: state.incomes.map(i => i.id === action.payload.id ? action.payload : i) };
        case 'DELETE_INCOME':
            return { ...state, incomes: state.incomes.filter(i => i.id !== action.payload) };

        case 'SET_EXPENSES':
            return { ...state, expenses: action.payload };

        case 'ADD_EXPENSE':
            return { ...state, expenses: [...state.expenses, { ...action.payload, id: generateId(state.expenses) }] };
        case 'UPDATE_EXPENSE':
            return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
        case 'DELETE_EXPENSE':
            return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

        case 'SET_PEMBIAYAAN':
            return { ...state, pembiayaan: action.payload };

        case 'ADD_PEMBIAYAAN':
            return { ...state, pembiayaan: [...(state.pembiayaan || []), { ...action.payload, id: generateId(state.pembiayaan || []) }] };
        case 'UPDATE_PEMBIAYAAN':
            return { ...state, pembiayaan: (state.pembiayaan || []).map(e => e.id === action.payload.id ? action.payload : e) };
        case 'DELETE_PEMBIAYAAN':
            return { ...state, pembiayaan: (state.pembiayaan || []).filter(e => e.id !== action.payload) };

        case 'SET_ACTIVITIES':
            return { ...state, activities: action.payload };

        case 'ADD_ACTIVITY':
            return { ...state, activities: [...state.activities, { ...action.payload, id: generateId(state.activities) }] };
        case 'UPDATE_ACTIVITY':
            return { ...state, activities: state.activities.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'DELETE_ACTIVITY':
            return { ...state, activities: state.activities.filter(a => a.id !== action.payload) };

        // ── LPJ Narratives ──
        case 'SET_LPJ_NARRATIVES':
            return { ...state, lpjNarratives: action.payload || {} };

        // ── Expense Items (Kuitansi & HOK) ──
        case 'SET_EXPENSE_ITEMS':
            return { ...state, expenseItems: action.payload };
        case 'ADD_EXPENSE_ITEM':
            return { ...state, expenseItems: [...state.expenseItems, action.payload] };
        case 'UPDATE_EXPENSE_ITEM':
            return { ...state, expenseItems: state.expenseItems.map(ei => ei.id === action.payload.id ? action.payload : ei) };
        case 'DELETE_EXPENSE_ITEM':
            return { ...state, expenseItems: state.expenseItems.filter(ei => ei.id !== action.payload) };

        // ── Sub Bidang CRUD ──
        case 'SET_SUB_BIDANG_ALL':
            return { ...state, subBidang: action.payload };

        case 'ADD_SUB_BIDANG': {
            const { bidang, nama, norek, id: sbId } = action.payload;
            const existing = state.subBidang[bidang] || [];
            const newItem = { id: sbId || generateId(existing), nama, norek: norek || '' };
            return {
                ...state,
                subBidang: { ...state.subBidang, [bidang]: [...existing, newItem] },
            };
        }
        case 'UPDATE_SUB_BIDANG': {
            const { bidang, id, nama, norek, oldNama } = action.payload;
            const updated = (state.subBidang[bidang] || []).map(sb =>
                sb.id === id ? { ...sb, nama, norek: norek !== undefined ? norek : sb.norek } : sb
            );
            const updatedActivities = oldNama && oldNama !== nama
                ? state.activities.map(a =>
                    a.bidang === bidang && a.sub_bidang === oldNama
                        ? { ...a, sub_bidang: nama }
                        : a
                )
                : state.activities;
            return {
                ...state,
                subBidang: { ...state.subBidang, [bidang]: updated },
                activities: updatedActivities,
            };
        }
        case 'DELETE_SUB_BIDANG': {
            const { bidang, id, nama } = action.payload;
            const filtered = (state.subBidang[bidang] || []).filter(sb => sb.id !== id);
            const filteredActivities = state.activities.filter(
                a => !(a.bidang === bidang && a.sub_bidang === nama)
            );
            return {
                ...state,
                subBidang: { ...state.subBidang, [bidang]: filtered },
                activities: filteredActivities,
            };
        }

        case 'RESET_DATA':
            return {
                villageInfo: defaultVillageInfo,
                incomes: [],
                expenses: [],
                pembiayaan: [],
                activities: [],
                subBidang: buildInitialSubBidang(),
                lpjNarratives: {},
                expenseItems: [],
            };

        default:
            return state;
    }
}

export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [loading, setLoading] = useState(true);
    const [activeTahun, setActiveTahunState] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [theme, setThemeState] = useReducer((_, t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem(THEME_KEY, t);
        return t;
    }, loadTheme(), (t) => {
        document.documentElement.setAttribute('data-theme', t);
        return t;
    });

    // Load year-filtered data from Supabase
    const loadYearData = useCallback(async (tahun) => {
        if (!tahun) return;
        try {
            // Load incomes for this year
            const { data: incomesData } = await supabase
                .from('incomes').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            dispatch({ type: 'SET_INCOMES', payload: incomesData || [] });

            // Load expenses for this year
            const { data: expensesData } = await supabase
                .from('expenses').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            dispatch({ type: 'SET_EXPENSES', payload: expensesData || [] });

            // Load activities for this year
            const { data: activitiesData } = await supabase
                .from('activities').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            dispatch({ type: 'SET_ACTIVITIES', payload: activitiesData || [] });

            // Load pembiayaan for this year
            const { data: pembiayaanData } = await supabase
                .from('pembiayaan').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            dispatch({ type: 'SET_PEMBIAYAAN', payload: pembiayaanData || [] });

            // Load lpj_narratives for this year
            const { data: narrativesData } = await supabase
                .from('lpj_narratives').select('*')
                .eq('tahun_anggaran', tahun)
                .maybeSingle();
            dispatch({ type: 'SET_LPJ_NARRATIVES', payload: narrativesData || {} });

            // Load expense_items for this year
            const { data: expenseItemsData } = await supabase
                .from('expense_items').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            dispatch({ type: 'SET_EXPENSE_ITEMS', payload: expenseItemsData || [] });

            // Load sub_bidang for this year
            const { data: subBidangData } = await supabase
                .from('sub_bidang').select('*')
                .eq('tahun_anggaran', tahun).order('id');
            if (subBidangData && subBidangData.length > 0) {
                const grouped = {};
                subBidangData.forEach(sb => {
                    if (!grouped[sb.bidang]) grouped[sb.bidang] = [];
                    grouped[sb.bidang].push({ id: sb.id, nama: sb.nama, norek: sb.norek || '' });
                });
                dispatch({ type: 'SET_SUB_BIDANG_ALL', payload: grouped });
            } else {
                dispatch({ type: 'SET_SUB_BIDANG_ALL', payload: buildInitialSubBidang() });
            }
        } catch (err) {
            console.error('Error loading year data:', err);
        }
    }, []);

    // Fetch available years list
    const fetchAvailableYears = useCallback(async () => {
        try {
            const { data } = await supabase.rpc('get_available_years');
            if (data && data.length > 0) {
                setAvailableYears(data.map(r => r.tahun));
            }
        } catch (err) {
            console.error('Error fetching available years:', err);
        }
    }, []);

    // Switch active year
    const setActiveTahun = useCallback(async (tahun) => {
        setLoading(true);
        setActiveTahunState(tahun);
        await loadYearData(tahun);
        setLoading(false);
    }, [loadYearData]);

    // Initial load: village info (global) + determine active year + load year data
    useEffect(() => {
        async function initialLoad() {
            try {
                // 1. Load village info (global, not year-filtered)
                const { data: villageData, error: villageError } = await supabase
                    .from('village_info').select('*')
                    .eq('id', 1).single();

                const { data: pejabatData } = await supabase
                    .from('pejabat_desa').select('*').order('id');

                if (!villageError && villageData) {
                    const { id, created_at, ...villageFields } = villageData;
                    dispatch({
                        type: 'SET_VILLAGE_INFO',
                        payload: {
                            ...defaultVillageInfo,
                            ...villageFields,
                            pejabat_desa: pejabatData || [],
                            kepala_desa: pejabatData?.find(p => p.jabatan?.toLowerCase().trim() === 'kepala desa')?.nama || '',
                            sekretaris_desa: pejabatData?.find(p => p.jabatan?.toLowerCase().trim() === 'sekretaris desa')?.nama || '',
                            bendahara: pejabatData?.find(p => p.jabatan?.toLowerCase().trim() === 'bendahara desa')?.nama || '',
                        },
                    });
                }

                // 2. Determine active year
                const tahunFromVillage = parseInt(villageData?.tahun_anggaran) || new Date().getFullYear();
                setActiveTahunState(tahunFromVillage);

                // 3. Fetch available years
                await fetchAvailableYears();

                // 4. Load year-specific data
                await loadYearData(tahunFromVillage);
            } catch (err) {
                console.error('Error loading from Supabase:', err);
            } finally {
                setLoading(false);
            }
        }
        initialLoad();
    }, [loadYearData, fetchAvailableYears]);

    const toggleTheme = () => {
        setThemeState(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <AppContext.Provider value={{
            state, dispatch, theme, toggleTheme, loading,
            activeTahun, setActiveTahun, availableYears, fetchAvailableYears,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}

export default AppContext;
