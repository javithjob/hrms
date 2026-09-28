import React, { useState, useEffect, useRef, useCallback } from 'react';
import { addDays, format, getDay } from 'date-fns';
import api from '../utils/api';
import { EmptyState, Field, Modal, PageHeader, Spinner, StatusBadge } from '../components/ui';
import { useEmployeeVisibility } from '../context/EmployeeVisibilityContext';
import { HiOutlineClipboardList, HiOutlineCloudUpload, HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi';
import { formatTo12Hr } from '../utils/timeUtils';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const groupEmployees = (records) => {
  const employees = new Map();

  records.forEach((record) => {
    if (!employees.has(record.employeeId)) {
      employees.set(record.employeeId, {
        employeeId: record.employeeId,
        name: record.name,
      });
    }
  });

  return Array.from(employees.values()).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
};

export default function AttendancePage() {
  const [months, setMonths] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [officialLeaveModalOpen, setOfficialLeaveModalOpen] = useState(false);
  const [officialLeaves, setOfficialLeaves] = useState([]);
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [leaveRange, setLeaveRange] = useState({ from: '', to: '', type: 'annual_leave', reason: '' });
  const [editRecordModalOpen, setEditRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editTimes, setEditTimes] = useState({ checkIn: '', checkOut: '', status: '' });
  const [savingRecord, setSavingRecord] = useState(false);
  const fileRef = useRef(null);
  const dropdownRef = useRef(null);

  const { syncWithEmployees, isVisible } = useEmployeeVisibility();
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const employeeIdOf = (employee) => employee.employeeId || employee.employeeNumber || '';
  const employeeNameOf = (employee) => employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim();

  useEffect(() => {
    const fetchAllEmployees = async () => {
      try {
        const { data } = await api.get('/employees', {
          params: { page: 1, limit: 10000 },
        });
        const emps = data.data || [];
        setAllEmployees(emps);
        syncWithEmployees(emps);
        if (emps.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(employeeIdOf(emps[0]));
        }
      } catch (error) {
        console.error('Failed to fetch employees', error);
      }
    };
    fetchAllEmployees();
  }, [syncWithEmployees]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMonths = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/months');
      setMonths(data.data);

      if (data.data.length && !selected) {
        setSelected({ month: data.data[0].month, year: data.data[0].year });
        setSelectedYear(String(data.data[0].year));
      }
    } catch (error) {
      toast.error('Unable to load attendance months');
    }
  }, [selected]);

  const loadRecord = useCallback(async () => {
    if (!selected) return;

    setLoading(true);

    try {
      const { data } = await api.get(`/attendance/${selected.year}/${selected.month}`);
      setRecord(data.data);
      setOfficialLeaves(data.data.officialLeaves || []);
    } catch (error) {
      if (error.response?.status === 404) {
        setRecord(null);
        return;
      }

      toast.error('Unable to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const handleUpload = async (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      toast.error('Only .xlsx or .xls files are supported');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/attendance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const message = data.results
        .map((item) => `${MONTHS[item.month - 1]} ${item.year} (${item.sourceStartDate} to ${item.sourceEndDate}): ${item.records} rows`)
        .join(', ');

      toast.success(`Attendance imported. ${message}`);
      await loadMonths();

      if (data.results?.length) {
        const latest = [...data.results].sort((left, right) => {
          if (left.year !== right.year) return right.year - left.year;
          return right.month - left.month;
        })[0];

        setSelected({ month: latest.month, year: latest.year });
        setSelectedYear(String(latest.year));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Attendance upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filteredEmployees = allEmployees.filter((employee) => {
    const id = employeeIdOf(employee).toLowerCase();
    const name = employeeNameOf(employee).toLowerCase();
    const query = filterEmployee.toLowerCase().trim();
    return isVisible(employeeIdOf(employee))
      && (!filterCategory || employee.category === filterCategory)
      && (!query || id.includes(query) || name.includes(query));
  });

  useEffect(() => {
    const selectedStillVisible = filteredEmployees.some(
      (employee) => employeeIdOf(employee) === selectedEmployeeId,
    );

    if (filteredEmployees.length && !selectedStillVisible) {
      setSelectedEmployeeId(employeeIdOf(filteredEmployees[0]));
    } else if (!filteredEmployees.length && selectedEmployeeId) {
      setSelectedEmployeeId('');
    }
  }, [filterCategory, filterEmployee, allEmployees, selectedEmployeeId]);

  const filteredRecords = (record?.records || []).filter((item) => {
    return item.employeeId === selectedEmployeeId;
  });

  const availableYears = Array.from(new Set(months.map((item) => item.year))).sort((left, right) => right - left);
  const visibleMonths = months.filter((item) => !selectedYear || String(item.year) === String(selectedYear));

  const cellRecordMap = new Map(
    filteredRecords.map((item) => [`${item.employeeId}__${item.date?.split('T')[0]}`, item])
  );

  const saveOfficialLeaves = async () => {
    if (!selected) return;

    try {
      await api.put(`/attendance/${selected.year}/${selected.month}/official-leaves`, {
        officialLeaves,
      });

      toast.success('Leave schedule saved');
      setOfficialLeaveModalOpen(false);
      loadRecord();
    } catch (error) {
      toast.error('Unable to save leave schedule');
    }
  };

  const addLeaveRange = () => {
    if (!leaveRange.from || !leaveRange.to || leaveRange.from > leaveRange.to) {
      toast.error('Choose a valid leave range');
      return;
    }
    const dates = [];
    for (let date = new Date(`${leaveRange.from}T12:00:00`); date <= new Date(`${leaveRange.to}T12:00:00`); date = addDays(date, 1)) {
      dates.push({ date: format(date, 'yyyy-MM-dd'), reason: leaveRange.reason, type: leaveRange.type });
    }
    setOfficialLeaves([...officialLeaves, ...dates]);
    setLeaveRange({ from: '', to: '', type: 'annual_leave', reason: '' });
  };

  const openEditRecord = (item) => {
    setEditingRecord(item);
    setEditTimes({
      checkIn: item.checkIn || '',
      checkOut: item.checkOut || '',
      status: item.status || 'present',
    });
    setEditRecordModalOpen(true);
  };

  const saveEditedRecord = async () => {
    if (!selected || !editingRecord) return;

    setSavingRecord(true);

    try {
      await api.put(`/attendance/${selected.year}/${selected.month}/record`, {
        employeeId: editingRecord.employeeId,
        date: editingRecord.date,
        checkIn: editTimes.checkIn,
        checkOut: editTimes.checkOut,
        status: editTimes.status,
      });

      toast.success('Attendance time updated');
      setEditRecordModalOpen(false);
      setEditingRecord(null);
      loadRecord();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update attendance time');
    } finally {
      setSavingRecord(false);
    }
  };

  const STATUS_CLASSES = {
    present: 'bg-emerald-500/80 text-black',
    absent: 'bg-red-500/90 text-white',
    annual_leave: 'bg-blue-500/90 text-white',
    sick_leave: 'bg-orange-500/90 text-white',
    emergency_leave: 'bg-rose-500/90 text-white',
    unpaid_leave: 'bg-red-500/90 text-white',
  };

  const renderCalendar = () => {
    if (!selected || !selectedEmployeeId) return null;

    const { year, month } = selected;
    const startDate = new Date(year, month - 2, 22);
    const endDate = new Date(year, month - 1, 21);
    const totalDays = Math.round((endDate - startDate) / 86400000) + 1;
    const startDayOfWeek = getDay(startDate);

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent" />);
    }

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
      const currentDate = addDays(startDate, dayIndex);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const item = cellRecordMap.get(`${selectedEmployeeId}__${dateStr}`);
      const dayNumber = currentDate.getDate();
      const isSunday = currentDate.getDay() === 0;
      const selectedEmployee = allEmployees.find((employee) => employeeIdOf(employee) === selectedEmployeeId);
      const isWeekOffDay = isSunday || (selectedEmployee?.category === 'white collar' && currentDate.getDay() === 6);

      let bgClass = "bg-obsidian-900 border-gold-500/10 hover:border-gold-500/50 cursor-pointer";
      let textClass = "text-slate-600";
      let statusTag = null;

      const isConfiguredLeave = record?.officialLeaves?.some((leave) => leave.date && leave.date.split('T')[0] === dateStr);

      if (item) {
        // Data consolidation: permission -> present, weekly_off -> absent
        let displayStatus = item.status === 'permission' ? 'present' :
          item.status === 'weekly_off' ? 'absent' :
            item.status;

        const hasCheckIn = !!item.checkIn;
        const hasCheckOut = !!item.checkOut;

        // Rule: Anyone missing checkin or checkout to be absent (only if currently 'present')
        if (displayStatus === 'present' && (!hasCheckIn || !hasCheckOut)) {
          displayStatus = 'absent';
        }

        // Rule: all sundays status to be week off if no checkin or checkout
        const isWO = isWeekOffDay && !hasCheckIn && !hasCheckOut;

        if (isWO) {
          bgClass = "bg-gray-400 text-white cursor-pointer hover:opacity-90";
          statusTag = "WO";
        } else {
          bgClass = `${STATUS_CLASSES[displayStatus] || 'bg-gold-500 border-gold-600'} text-white cursor-pointer hover:opacity-90`;
          const tagMap = {
            present: 'P',
            absent: 'A',
            annual_leave: 'AL',
            sick_leave: 'SL',
            emergency_leave: 'EL',
            unpaid_leave: 'UPL',
            official_leave: 'L',
            casual_leave: 'L',
            on_duty: 'L',
          };
          statusTag = tagMap[displayStatus] || displayStatus.substring(0, 2).toUpperCase();
        }
        textClass = "text-black";

        // Pass the corrected status to the edit modal
        const effectiveModalStatus = isWO ? 'weekly_off' : displayStatus;
        // (This will be used in the onClick below)
      } else if (isWeekOffDay) {
        bgClass = "bg-crimson-400 text-white cursor-not-allowed";
        textClass = "text-white";
        statusTag = "WO";
      } else if (isConfiguredLeave) {
        bgClass = 'bg-blue-500/80 text-white cursor-not-allowed';
        textClass = "text-white";
        statusTag = "L";
      } else {
        bgClass = `${STATUS_CLASSES.absent} text-white cursor-pointer hover:opacity-90`;
        textClass = "text-white";
        statusTag = "A";
      }

      // Re-calculating effectiveStatus for the onClick closure
      const finalModalStatus = item ? (isWeekOffDay && !item.checkIn && !item.checkOut ? 'weekly_off' : (item.status === 'permission' ? 'present' : (item.status === 'weekly_off' ? 'absent' : (item.status === 'present' && (!item.checkIn || !item.checkOut) ? 'absent' : item.status)))) : (isWeekOffDay ? 'weekly_off' : 'absent');

      days.push(
        <div
          key={dateStr}
          onClick={() => {
            if (item) {
              openEditRecord({ ...item, status: finalModalStatus });
            } else if (!isWeekOffDay && !isConfiguredLeave) {
              const emp = allEmployees.find(e => employeeIdOf(e) === selectedEmployeeId);
              openEditRecord({
                employeeId: selectedEmployeeId,
                date: dateStr,
                name: emp ? employeeNameOf(emp) : 'Employee',
                status: 'absent'
              });
            }
          }}
          className={`relative h-24 p-2 rounded-xl flex flex-col transition-all ${bgClass}`}
        >
          <span className={`text-black/80 font-medium`}>{dayNumber}</span>
          {statusTag && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl opacity-80 select-none font-semibold text-black/70">
              {statusTag}
            </div>
          )}
          {item && (item.checkIn || item.checkOut) && (
            <div className="mt-auto flex justify-between text-[11px] opacity-90 font-medium">
              <span>{formatTo12Hr(item.checkIn) || '--'}</span>
              <span>{formatTo12Hr(item.checkOut) || '--'}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-2 md:gap-4 mt-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs uppercase font-semibold tracking-[0.2em] mb-2"
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Upload the monthly XLS in the original machine format. Each upload merges by employee and date."
      />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-6 mb-6">

        <div
          className={`luxury-card border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${dragActive ? 'drag-over' : 'border-gold-500/20 hover:border-gold-500/40'
            }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleUpload(event.dataTransfer.files[0]);
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => handleUpload(event.target.files[0])}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <span className="text-slate-500 text-sm">Importing monthly attendance...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <HiOutlineCloudUpload className="w-10 h-10 text-slate-600" />
              <div className="text-slate-800 text-base font-semibold">Upload monthly attendance XLS</div>
              <div className="text-slate-500 text-sm max-w-2xl mx-auto">
                The importer reads your real columns: <span className="">E. Code</span>,
                <span className=""> Name</span>, <span className="">Attendance Date</span>,
                <span className=""> InTime</span>, and <span className=""> OutTime</span>.
              </div>
            </div>
          )}
        </div>

        <div className="luxury-card p-6 flex flex-col lg:flex-row gap-6">
          {months.length > 0 ? (
            <>
              {/* Column 1: Year Selection */}
              <div className="w-full lg:w-32 shrink-0">
                <label className="text-xs text-slate-600 font-medium uppercase tracking-[0.1em] mb-3 block ml-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(event) => {
                    const nextYear = event.target.value;
                    setSelectedYear(nextYear);
                    const firstMonth = months.find((item) => String(item.year) === nextYear);
                    if (firstMonth) setSelected({ month: firstMonth.month, year: firstMonth.year });
                    else setSelected(null);
                  }}
                  className="luxury-input appearance-none w-full"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>


              {/* Column 2: Month Selection */}
              <div className="flex-1">
                <label className="text-xs text-slate-600 font-medium uppercase tracking-[0.1em] mb-3 block ml-1">
                  Month
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                  {MONTHS.map((name, idx) => {
                    const m = idx + 1;
                    const monthItem = months.find(item => item.month === m && String(item.year) === String(selectedYear));
                    const isAvailable = !!monthItem;
                    const isActive = selected?.month === m && String(selected?.year) === String(selectedYear);

                    return (
                      <button
                        key={name}
                        disabled={!isAvailable}
                        onClick={() => setSelected({ month: m, year: Number(selectedYear) })}
                        className={`px-2 py-2 rounded-full text-sm transition-all border ${isActive
                          ? 'bg-gold-500 text-white border-gold-500 shadow-gold'
                          : isAvailable
                            ? 'border-gold-500/20 text-slate-600 hover:border-gold-500/50 hover:text-slate-800'
                            : 'opacity-40 cursor-not-allowed'
                          }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Divider for XL */}
              <div className="hidden xl:block w-px bg-gold-500/10" />

              {/* Column 3: Leave Schedule */}
              <div className="w-full lg:w-[320px] xl:w-[350px] 2xl:w-[450px] shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-600 font-medium uppercase tracking-widest block ml-1">
                    Leave Schedule
                  </label>
                  <button
                    onClick={() => setOfficialLeaveModalOpen(true)}
                    className="text-gold-600 hover:text-gold-700 bg-slate-300 p-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors"
                  >
                    Manage
                  </button>
                </div>

                {record?.officialLeaves?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[120px] pr-1 scrollbar-thin">
                    {record.officialLeaves.map((leave, index) => (
                      <span key={`${leave.date}-${index}`} className="badge-ol !py-1.5 !px-3 !text-[11px] shadow-sm flex items-center gap-2">
                        <span className="font-bold border-r border-gold-500/10 pr-2">
                          {format(new Date(leave.date), 'dd MMM')}
                        </span>
                        <span className="truncate max-w-[120px]">{leave.reason || leave.type?.replace('_', ' ') || 'Leave'}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 rounded-xl border border-dashed border-gold-500/20 text-slate-500 text-[11px] italic text-center">
                    No leave dates recorded.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 text-slate-500 text-sm italic text-center py-4">
              Upload attendance to enable selection and leave scheduling.
            </div>
          )}
        </div>

      </div>

      {selected && (
        <div className="luxury-card">
          {loading ? (
            <div className="flex justify-center py-24">
              <Spinner />
            </div>
          ) : !record ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={HiOutlineClipboardList}
                title="No attendance records"
                subtitle="This month hasn't been uploaded yet, or data is missing for the selected period."
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_0.4fr] items-start mb-8 border-b border-gold-500/10 pb-6 gap-6">
                <div className="w-full">
                  <div className="text-slate-600 text-[11px] uppercase tracking-widest font-medium mb-2 text-left">Status Key</div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-600">Present (P)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-slate-600">Absent (A)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm text-slate-600">Week Off (WO)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-600">Leave</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:max-w-xs md:ml-auto">
                  <label className="text-xs text-slate-600 font-medium uppercase tracking-[0.1em] mb-2 block ml-1">Filter Employees</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} placeholder="Employee ID or name" className="luxury-input" />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="luxury-input">
                      <option value="">All categories</option>
                      <option value="white collar">White Collar</option>
                      <option value="blue collar">Blue Collar</option>
                    </select>
                  </div>
                  <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="luxury-input w-full">
                    {filteredEmployees.sort((a, b) => employeeIdOf(a).localeCompare(employeeIdOf(b), undefined, { numeric: true })).map((emp) => (
                      <option key={employeeIdOf(emp)} value={employeeIdOf(emp)}>{employeeNameOf(emp)} [{employeeIdOf(emp)}]</option>
                    ))}
                  </select>
                </div>
              </div>
              {renderCalendar()}
            </div>
          )}
        </div>
      )}

      <Modal
        open={officialLeaveModalOpen}
        onClose={() => setOfficialLeaveModalOpen(false)}
        title="Leave Schedule"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-gold-500/20">
            <Field label="From"><input type="date" value={leaveRange.from} onChange={(e) => setLeaveRange({ ...leaveRange, from: e.target.value })} className="luxury-input w-full" /></Field>
            <Field label="To"><input type="date" value={leaveRange.to} onChange={(e) => setLeaveRange({ ...leaveRange, to: e.target.value })} className="luxury-input w-full" /></Field>
            <Field label="Leave Type">
              <select value={leaveRange.type} onChange={(e) => setLeaveRange({ ...leaveRange, type: e.target.value })} className="luxury-input w-full">
                <option value="annual_leave">Annual Leave (AL)</option><option value="sick_leave">Sick Leave (SL)</option><option value="emergency_leave">Emergency Leave (EL)</option><option value="unpaid_leave">Unpaid Leave (UPL)</option><option value="paternity_leave">Paternity Leave</option><option value="maternity_leave">Maternity Leave</option><option value="bereavement_leave">Bereavement Leave</option>
              </select>
            </Field>
            <Field label="Reason"><input value={leaveRange.reason} onChange={(e) => setLeaveRange({ ...leaveRange, reason: e.target.value })} className="luxury-input w-full" /></Field>
            <button onClick={addLeaveRange} className="btn-ghost col-span-2">Add Leave Range</button>
          </div>
          {officialLeaves.map((leave, index) => (
            <div key={`${leave.date || 'new'}-${index}`} className="flex gap-3 items-center">
              <input
                type="date"
                value={leave.date ? leave.date.split('T')[0] : ''}
                onChange={(event) => {
                  const next = [...officialLeaves];
                  next[index] = { ...next[index], date: event.target.value };
                  setOfficialLeaves(next);
                }}
                className="luxury-input !w-44"
              />
              <input
                value={leave.reason || ''}
                placeholder="Leave reason"
                onChange={(event) => {
                  const next = [...officialLeaves];
                  next[index] = { ...next[index], reason: event.target.value };
                  setOfficialLeaves(next);
                }}
                className="luxury-input flex-1"
              />
              <select value={leave.type || 'annual_leave'} onChange={(event) => { const next = [...officialLeaves]; next[index] = { ...next[index], type: event.target.value }; setOfficialLeaves(next); }} className="luxury-input !w-40">
                {['official_leave', 'casual_leave', 'on_duty'].includes(leave.type) && <option value={leave.type} disabled>Leave</option>}
                <option value="annual_leave">AL</option><option value="sick_leave">SL</option><option value="emergency_leave">EL</option><option value="unpaid_leave">UPL</option><option value="paternity_leave">PL</option><option value="maternity_leave">ML</option><option value="bereavement_leave">BL</option>
              </select>
              <button
                onClick={() => setOfficialLeaves(officialLeaves.filter((_, itemIndex) => itemIndex !== index))}
                className="p-2 rounded-xl text-crimson-500 hover:bg-crimson-500/10"
              >
                <HiOutlineTrash className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setOfficialLeaves([...officialLeaves, { date: '', reason: '' }])}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Add Leave Date
          </button>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
            <button onClick={() => setOfficialLeaveModalOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={saveOfficialLeaves} className="btn-gold">
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editRecordModalOpen}
        onClose={() => setEditRecordModalOpen(false)}
        title="Edit Attendance Time"
      >
        <div className="space-y-5">
          {editingRecord && (
            <div className="luxury-card p-4">
              <div className="font-semibold text-slate-700">{editingRecord.name}</div>
              <div className="text-sm text-slate-500 mt-1">
                {editingRecord.employeeId} | {format(new Date(editingRecord.date), 'dd MMM yyyy')}
              </div>
              <div className="mt-3">
                <StatusBadge status={editingRecord.status} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="In Time">
              <div className="relative group">
                <input
                  type="time"
                  value={editTimes.checkIn}
                  onChange={(event) => setEditTimes({ ...editTimes, checkIn: event.target.value })}
                  className="luxury-input w-full"
                />
                {editTimes.checkIn && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                    {formatTo12Hr(editTimes.checkIn)}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Out Time">
              <div className="relative group">
                <input
                  type="time"
                  value={editTimes.checkOut}
                  onChange={(event) => setEditTimes({ ...editTimes, checkOut: event.target.value })}
                  className="luxury-input w-full"
                />
                {editTimes.checkOut && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                    {formatTo12Hr(editTimes.checkOut)}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Status">
              <select
                value={editTimes.status}
                onChange={(event) => setEditTimes({ ...editTimes, status: event.target.value })}
                className="luxury-input appearance-none"
              >
                {['official_leave', 'casual_leave', 'on_duty'].includes(editTimes.status) && <option value={editTimes.status} disabled>Leave</option>}
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="weekly_off">Week Off</option>
                <option value="annual_leave">Annual Leave (AL)</option>
                <option value="sick_leave">Sick Leave (SL)</option>
                <option value="emergency_leave">Emergency Leave (EL)</option>
                <option value="unpaid_leave">Unpaid Leave (UPL)</option>
                <option value="paternity_leave">Paternity Leave</option>
                <option value="maternity_leave">Maternity Leave</option>
                <option value="bereavement_leave">Bereavement Leave</option>
              </select>
            </Field>

          </div>



          <div className="text-sm text-slate-500">
            Use this to correct attendance times or update leave status. Changes here will also sync to payroll.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
            <button onClick={() => setEditRecordModalOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={saveEditedRecord} disabled={savingRecord} className="btn-gold">
              {savingRecord ? 'Saving...' : 'Save Time'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
