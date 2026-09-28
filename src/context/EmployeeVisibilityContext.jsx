import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const EmployeeVisibilityContext = createContext();

export const useEmployeeVisibility = () => {
    const context = useContext(EmployeeVisibilityContext);
    if (!context) {
        throw new Error('useEmployeeVisibility must be used within an EmployeeVisibilityProvider');
    }
    return context;
};

export const EmployeeVisibilityProvider = ({ children }) => {
    const [enabledEmployeeIds, setEnabledEmployeeIds] = useState(() => {
        const saved = localStorage.getItem('visible_employees');
        return saved ? JSON.parse(saved) : null; 
    });

    const [seenEmployeeIds, setSeenEmployeeIds] = useState(() => {
        const saved = localStorage.getItem('seen_employees');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (enabledEmployeeIds !== null) {
            localStorage.setItem('visible_employees', JSON.stringify(enabledEmployeeIds));
        }
    }, [enabledEmployeeIds]);

    useEffect(() => {
        localStorage.setItem('seen_employees', JSON.stringify(seenEmployeeIds));
    }, [seenEmployeeIds]);

    const toggleEmployee = useCallback((employeeId) => {
        setEnabledEmployeeIds((prev) => {
            if (prev === null) return [employeeId]; 
            if (prev.includes(employeeId)) {
                return prev.filter((id) => id !== employeeId);
            } else {
                return [...prev, employeeId];
            }
        });
    }, []);

    const setAllEnabled = useCallback((ids) => {
        setEnabledEmployeeIds(ids);
    }, []);

    const clearAll = useCallback(() => {
        setEnabledEmployeeIds([]);
    }, []);

    const isVisible = useCallback((employeeId) => {
        if (enabledEmployeeIds === null) return true; 
        return enabledEmployeeIds.includes(employeeId);
    }, [enabledEmployeeIds]);

    const seenRef = React.useRef(seenEmployeeIds);
    useEffect(() => {
        seenRef.current = seenEmployeeIds;
    }, [seenEmployeeIds]);

    const syncWithEmployees = useCallback((allEmps) => {
        if (!allEmps || !Array.isArray(allEmps) || allEmps.length === 0) return;

        const activeIds = allEmps.filter(e => e.category === 'active').map(e => e.employeeNumber);
        const inactiveIds = allEmps.filter(e => e.category === 'inactive').map(e => e.employeeNumber);

        setEnabledEmployeeIds((prevEnabled) => {
            const currentEnabled = prevEnabled || [];
            
            // 1. Auto-Uncheck: Remove IDs that are now inactive
            let nextEnabled = currentEnabled.filter(id => !inactiveIds.includes(id));
            
            // 2. Auto-Check: Add IDs that are active but were NOT in seen list
            // (This handles newly added employees and those transitioning from Inactive -> Active)
            const newlyActive = activeIds.filter(id => !seenRef.current.includes(id));
            if (newlyActive.length > 0) {
                nextEnabled = [...new Set([...nextEnabled, ...newlyActive])];
            }
            
            return nextEnabled;
        });

        // 3. Update seen list: Remove inactive, add current active
        setSeenEmployeeIds((prevSeen) => {
            const filtered = (prevSeen || []).filter(id => !inactiveIds.includes(id));
            return [...new Set([...filtered, ...activeIds])];
        });
    }, []);
 // Stable identity!

    return (
        <EmployeeVisibilityContext.Provider
            value={{
                enabledEmployeeIds,
                setEnabledEmployeeIds,
                toggleEmployee,
                setAllEnabled,
                clearAll,
                isVisible,
                syncWithEmployees,
            }}
        >
            {children}
        </EmployeeVisibilityContext.Provider>
    );
};

