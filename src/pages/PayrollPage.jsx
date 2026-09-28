import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineOfficeBuilding, HiOutlineRefresh, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineDownload, HiOutlineMail } from 'react-icons/hi';
import { formatTo12Hr, formatRangeTo12Hr } from '../utils/timeUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useEmployeeVisibility } from '../context/EmployeeVisibilityContext';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (v) =>
  `Rs. ${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** Convert total minutes to "Xh Ym" display string */
const fmtMinutes = (mins) => {
  if (!mins && mins !== 0) return '—';
  const m = Math.round(mins);
  if (m === 0) return '0 min';
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem} min`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
};

// ── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ label, value, accent = 'gold' }) {
  const cls = {
    gold: 'text-gold-600  bg-gold-500/10  border-gold-500/20',
    blue: 'text-sapphire-500 bg-sapphire-500/10 border-sapphire-500/20',
    green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    red: 'text-crimson-500  bg-crimson-500/10  border-crimson-500/20',
  };

  return (
    <div className="luxury-card p-4">
      <div className="text-slate-600 font-medium text-xs uppercase tracking-[0.1em] mb-2">{label}</div>
      <div className="flex items-center justify-between gap-3">
        <div className={`text-slate-700 ${String(value).length > 5 ? 'text-2xl' : 'text-2xl'}`}>{value}</div>
        <div className={`px-3 py-2 rounded-full border text-xs font-semibold whitespace-nowrap ${cls[accent]}`}>
          {label}
        </div>
      </div>
    </div>
  );
}

// ── Inline time-edit cell ─────────────────────────────────────────────────────
function TimeEditCell({ value, onSave, accent = 'green' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef(null);

  // Reset draft when value changes (after save or refresh)
  useEffect(() => { setDraft(value || ''); }, [value]);

  const startEdit = () => {
    setDraft(value || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancel = () => { setEditing(false); setDraft(value || ''); };

  const confirm = () => {
    setEditing(false);
    // Only call onSave if value actually changed
    if (draft.trim() !== (value || '').trim()) {
      onSave(draft.trim());
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') cancel();
  };

  const colorMap = { green: 'text-emerald-500', red: 'text-crimson-500' };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[110px]">
        <input
          ref={inputRef}
          type="time"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          className="luxury-input !py-1 !px-2 !rounded-lg text-xs  w-28"
        />
        <button
          onClick={confirm}
          className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all"
          title="Save"
        >
          <HiOutlineCheck className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={cancel}
          className="p-1 rounded-lg text-crimson-500 hover:bg-crimson-500/10 transition-all"
          title="Cancel"
        >
          <HiOutlineX className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group min-w-[80px]">
      <span className={` text-xs ${value ? colorMap[accent] : 'text-slate-400'}`}>
        {formatTo12Hr(value) || '--'}
      </span>
      <button
        onClick={startEdit}
        className="p-1 rounded-md text-slate-400 hover:text-gold-500 hover:bg-gold-500/10
          opacity-0 group-hover:opacity-100 transition-all"
        title="Edit (payroll only)"
      >
        <HiOutlinePencil className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Inline status-edit cell ─────────────────────────────────────────────────────
function StatusEditCell({ value, onSave, disabled = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || 'present');

  useEffect(() => { setDraft(value || 'present'); }, [value]);

  const confirm = (newVal) => {
    setEditing(false);
    if (newVal !== value) {
      onSave(newVal);
    }
  };

  const STATUS_LABELS = {
    present: { label: 'Present', color: 'text-emerald-500' },
    absent: { label: 'Absent', color: 'text-red-500' },
    casual_leave: { label: 'Casual Leave', color: 'text-blue-500' },
    on_duty: { label: 'On Duty', color: 'text-yellow-500' },
    official_leave: { label: 'Official Leave', color: 'text-purple-500' },
    half_day: { label: 'Half Day', color: 'text-orange-500' },
    weekly_off: { label: 'Week Off', color: 'text-gray-500' },
    permission: { label: 'Present', color: 'text-teal-500' }
  };

  const status = STATUS_LABELS[value] || {};

  if (editing) {
    return (
      <select
        autoFocus
        value={draft}
        onChange={(e) => confirm(e.target.value)}
        onBlur={() => setEditing(false)}
        className="luxury-input !py-1 !px-2 !rounded-lg text-xs w-32"
      >
        {Object.entries(STATUS_LABELS).map(([k, status]) => (
          <option key={k} value={k}>{status.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group min-w-[80px]">
      <span className={`text-[12px] font-medium ${status.color || 'text-slate-600'}`}>
        {status.label}
      </span>
      <button
        onClick={() => setEditing(true)}
        disabled={disabled}
        className="p-1 rounded-md text-slate-400 hover:text-gold-500 hover:bg-gold-500/10
          opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0 disabled:cursor-not-allowed"
        title={disabled ? 'Sundays are always Week Off' : 'Edit status'}
      >
        <HiOutlinePencil className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function PermissionTimeRange({ row }) {
  const { permissionStartTime, permissionEndTime } = row;
  if (!permissionStartTime || !permissionEndTime) {
    return <span className="text-amber-500">--</span>;
  }

  const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };
  const toTime = (minutes) => {
    const normalized = Math.max(0, minutes);
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const start = toMinutes(permissionStartTime);
  const end = toMinutes(permissionEndTime);
  const freeMinutes = Math.max(0, Number(row.freePermissionMinutes || 0));
  const reducedMinutes = Math.max(0, Number(row.reducedPermissionMinutes || 0));

  if (start === null || end === null || end <= start || !freeMinutes || !reducedMinutes) {
    return (
      <span className={reducedMinutes > 0 ? 'text-red-500' : 'text-emerald-500'}>
        {`${formatTo12Hr(permissionStartTime)} - ${formatTo12Hr(permissionEndTime)}`}
      </span>
    );
  }

  const split = Math.min(end, start + freeMinutes);

  return (
    <div className="flex flex-col gap-0.5 leading-tight">
      <span className="text-emerald-500">
        {`${formatTo12Hr(permissionStartTime)} - ${formatTo12Hr(toTime(split))}`}
      </span>
      <span className="text-red-500">
        {`${formatTo12Hr(toTime(split))} - ${formatTo12Hr(permissionEndTime)}`}
      </span>
    </div>
  );
}

export default function PayrollPage() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [monthEmployees, setMonthEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthHolidaysOpen, setMonthHolidaysOpen] = useState(false);
  const [savingRecord, setSavingRecord] = useState(null); // dateStr being saved
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    officeStartTime: '08:00',
    officeEndTime: '17:00',
    lunchTime: '13:00-14:00',
  });
  const [settings, setSettings] = useState({
    officeStartTime: '08:00',
    officeEndTime: '17:00',
    lunchTime: '13:00-14:00',
  });
  const [officialLeaves, setOfficialLeaves] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState({
    permissionDates: '',
  });

  const { isVisible } = useEmployeeVisibility();

  // ── loaders ──────────────────────────────────────────────────────────────
  const loadMonths = useCallback(async () => {
    try {
      const { data } = await api.get('/payroll/months');
      setMonths(data.data);
      if (data.data.length && !selectedMonth) {
        const first = data.data[0];
        setSelectedMonth(first);
        setSelectedYear(String(first.year));
        setSettings({
          officeStartTime: first.officeStartTime || '08:00',
          officeEndTime: first.officeEndTime || '17:00',
          lunchTime: first.lunchTime || '13:00-14:00',
        });
      }
    } catch {
      toast.error('Unable to load payroll months');
    }
  }, [selectedMonth]);

  const loadMonthEmployees = useCallback(async () => {
    if (!selectedMonth) { setMonthEmployees([]); return; }
    try {
      const { data } = await api.get(`/payroll/${selectedMonth.year}/${selectedMonth.month}/employees`);
      const emps = data.data || [];
      setMonthEmployees(emps);
    } catch (err) {
      if (err.response?.status !== 401) toast.error('Unable to load employees for this month');
      setMonthEmployees([]);
    }
  }, [selectedMonth]);

  const loadPayroll = useCallback(async () => {
    if (!selectedMonth || !selectedEmployee) { setPayrollData(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/payroll/${selectedMonth.year}/${selectedMonth.month}/${selectedEmployee}`);
      setPayrollData(data.data);
      setSettings({
        officeStartTime: data.data.officeStartTime || '08:00',
        officeEndTime: data.data.officeEndTime || '17:00',
        lunchTime: data.data.lunchTime || '13:00-14:00',
      });
      setOfficialLeaves(data.data.officialLeaves || []);

      setEmployeeSummary({
        salary: data.data.employeeSummary?.salary || 15000,
        permissionDates: (data.data.employeeSummary?.permissionDates || [])
          .map(dayNum => {
            const record = (data.data.records || []).find(r => new Date(r.date).getUTCDate() === dayNum);
            const dateLabel = format(new Date(year, monthIdx, dayNum), 'dd');
            if (record && record.permissionStartTime && record.permissionEndTime) {
              return `${dateLabel} (${formatTo12Hr(record.permissionStartTime)} - ${formatTo12Hr(record.permissionEndTime)})`;
            }
            return dateLabel;
          })
          .join(', '),
      });
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Unable to load payroll data');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, selectedMonth]);

  const loadGlobalSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/payroll/global-settings');
      setGlobalSettings(data.data);
    } catch {
      console.error('Unable to load global settings');
    }
  }, []);

  useEffect(() => { loadMonths(); }, [loadMonths]);
  useEffect(() => { loadGlobalSettings(); }, [loadGlobalSettings]);
  useEffect(() => { loadMonthEmployees(); }, [loadMonthEmployees]);
  useEffect(() => { loadPayroll(); }, [loadPayroll]);

  useEffect(() => {
    const currentEmployeeExists = monthEmployees.some(
      (employee) => employee.payrollEmployeeId === selectedEmployee,
    );
    if (!currentEmployeeExists) {
      setSelectedEmployee(monthEmployees[0]?.payrollEmployeeId || '');
    }
  }, [monthEmployees, selectedEmployee]);

  // ── derived ───────────────────────────────────────────────────────────────
  const selectedEmployeeMeta = monthEmployees.find(
    (e) => e.payrollEmployeeId === selectedEmployee,
  );
  const availableYears = Array.from(new Set(months.map((m) => m.year))).sort((a, b) => b - a);
  const visibleMonths = months.filter((m) => !selectedYear || String(m.year) === String(selectedYear));



  // ── save global settings ──────────────────────────────────────────────────
  const saveGlobalSettings = async () => {
    try {
      await api.put('/payroll/global-settings', globalSettings);
      toast.success('Global payroll settings saved');
      setSettingsOpen(false);
      // Refresh current data if needed, but primarily for future months
      loadMonths();
      if (selectedMonth) loadPayroll();
    } catch {
      toast.error('Unable to save global settings');
    }
  };

  // ── save employee summary ─────────────────────────────────────────────────
  const saveEmployeeSummary = async () => {
    if (!selectedMonth || !selectedEmployee || !payrollData) return;
    try {
      await api.put(
        `/payroll/${selectedMonth.year}/${selectedMonth.month}/${selectedEmployee}/summary`,
        {
          name: payrollData.employeeSummary?.name
            || `${selectedEmployeeMeta?.firstName || ''} ${selectedEmployeeMeta?.lastName || ''}`.trim(),
          salary: employeeSummary.salary,
        },
      );
      toast.success('Employee values saved');
      loadPayroll();
    } catch {
      toast.error('Unable to save employee values');
    }
  };

  // ── inline edit: save checkIn or checkOut to payroll only ─────────────────
  const saveRecordTime = async (dateStr, field, newValue) => {
    if (!selectedMonth || !selectedEmployee) return;
    setSavingRecord(dateStr);
    try {
      await api.patch(
        `/payroll/${selectedMonth.year}/${selectedMonth.month}/${selectedEmployee}/record`,
        { date: dateStr, [field]: newValue },
      );
      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated in payroll`);
      loadPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSavingRecord(null);
    }
  };

  const [isChanged, setIsChanged] = useState(false);

  // Analytics calculations — track actual day-numbers for tooltip display
  let totalEarly = 0;
  let totalLate = 0;
  let totalOver = 0;

  // Arrays of day-of-month numbers per category
  let workingDayDates = [];
  let sundayDates = [];
  let officialLeaveDates_arr = [];
  let clDates = [];
  let permissionDates_arr = [];
  let lopDates = []; // Loss of Pay = Absent OR missing CheckIn/CheckOut

  if (payrollData?.records && settings) {
    payrollData.records.forEach(row => {
      const toMinutes = (time) => {
        if (!time || time === '--') return null;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      const officeStart = toMinutes(settings.officeStartTime);
      const officeEnd = toMinutes(settings.officeEndTime);
      const checkIn = toMinutes(row.checkIn);
      const checkOut = toMinutes(row.checkOut);
      const isSunday = new Date(row.date).getDay() === 0;
      const dayNum = new Date(row.date).getDate(); // 1-31
      // Missing if either CheckIn or CheckOut is absent
      const isEmpty = checkIn === null || checkOut === null;

      if (!isSunday && !isEmpty) {
        if (checkIn < officeStart) totalEarly += (officeStart - checkIn);
        if (checkIn > officeStart) totalLate += (checkIn - officeStart);
        if (checkOut > officeEnd) totalOver += (checkOut - officeEnd);
      }

      const st = row.status || 'absent';

      if (isSunday) {
        sundayDates.push(dayNum);
      } else if (st === 'official_leave') {
        officialLeaveDates_arr.push(dayNum);
      } else if (st === 'casual_leave') {
        clDates.push(dayNum);
      } else if (st === 'permission') {
        const timeLabel = row.permissionStartTime && row.permissionEndTime
          ? `${dayNum} (${formatTo12Hr(row.permissionStartTime)} - ${formatTo12Hr(row.permissionEndTime)})`
          : dayNum;
        permissionDates_arr.push(timeLabel);
        workingDayDates.push(dayNum);
      } else if (st === 'absent' || st === 'weekly_off') {
        lopDates.push(dayNum);
      } else if (isEmpty) {
        // Missing check-in/out → Loss of Pay
        lopDates.push(dayNum);
      } else if (
        st === 'present' ||
        st === 'on_duty' ||
        st === 'half_day'
      ) {
        workingDayDates.push(dayNum);
      } else {
        // Fallback
        lopDates.push(dayNum);
      }
    });
  }

  // Derived counts from date arrays
  const workingDaysCount = workingDayDates.length;
  const sundaysCount = sundayDates.length;
  const officialLeaveCount = officialLeaveDates_arr.length;
  const clDaysCount = clDates.length;
  const permissionDaysCount = permissionDates_arr.length;
  const lopDaysCount = lopDates.length;
  const nonWorkingDaysCount = sundaysCount + officialLeaveCount + clDaysCount + lopDaysCount;

  // Helper: "5 (1, 8, 15, 22, 29)"
  const fmtDateList = (arr) =>
    arr.length ? `${arr.length} (${arr.join(', ')})` : '0';

  const daysChartData = {
    labels: ['Working Days', 'Non-working Days', 'Casual Leave', 'Loss of Pay (Absent)'],
    datasets: [{
      label: 'Days',
      data: [workingDaysCount, nonWorkingDaysCount, clDaysCount, lopDaysCount],
      backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
      borderWidth: 0,
      borderRadius: 4,
    }]
  };

  const daysChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const lbl = context.label;
            if (lbl === 'Non-working Days') {
              const lines = [`Total: ${context.raw}`];
              if (sundaysCount) lines.push(`Week Off: ${fmtDateList(sundayDates)}`);
              if (officialLeaveCount) lines.push(`Official Leave: ${fmtDateList(officialLeaveDates_arr)}`);
              if (clDaysCount) lines.push(`Casual Leave: ${fmtDateList(clDates)}`);
              if (lopDaysCount) lines.push(`Loss of Pay (Absent): ${fmtDateList(lopDates)}`);
              return lines;
            }
            if (lbl === 'Working Days') return `Working Days: ${fmtDateList(workingDayDates)}`;
            if (lbl === 'Casual Leave') return `Casual Leave: ${fmtDateList(clDates)}`;
            if (lbl === 'Loss of Pay (Absent)') return `Loss of Pay: ${fmtDateList(lopDates)}`;
            return `${lbl}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    }

  };

  const minutesChartData = {
    labels: ['Early Checkin', 'Late', 'Overtime'],
    datasets: [{
      label: 'Minutes',
      data: [totalEarly, totalLate, totalOver],
      backgroundColor: ['#34d399', '#f87171', '#fbbf24'],
      borderWidth: 0,
      borderRadius: 4,
    }]
  };

  const minutesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    }
  };

  // ── generate PDF for a single employee's data ────────────────────────────
  const buildPDF = (empPayrollData, empMeta, empSettings, monthObj, returnBlob = false) => {
    const period = `${MONTHS[monthObj.month - 1]} ${monthObj.year}`;
    const empName = empPayrollData.employeeSummary?.name
      || `${empMeta?.firstName || ''} ${empMeta?.lastName || ''}`.trim();
    const empId = empMeta?.employeeId || empMeta?.payrollEmployeeId || '';
    const department = empMeta?.department || 'N/A';
    const role = empMeta?.role || 'N/A';
    const salary = Number(empPayrollData.employeeSummary?.salary || empPayrollData.employee?.salary || 0).toLocaleString('en-IN');

    // Recalculate stats for this employee's data
    let wdCount = 0, earlyMin = 0, lateMin = 0, overMin = 0;
    let lopDatesArr = [];

    (empPayrollData.records || []).forEach(row => {
      const toM = (t) => { if (!t || t === '--') return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      const offStart = toM(empSettings.officeStartTime);
      const offEnd = toM(empSettings.officeEndTime);
      const ci = toM(row.checkIn);
      const co = toM(row.checkOut);
      const isSun = new Date(row.date).getDay() === 0;
      const isEmpty = ci === null || co === null;
      const dayNum = new Date(row.date).getDate();
      const st = row.status || 'absent';

      if (!isSun && !isEmpty) {
        if (ci < offStart) earlyMin += (offStart - ci);
        if (ci > offStart) lateMin += (ci - offStart);
        if (co > offEnd) overMin += (co - offEnd);
      }

      if (isSun) { /* week off */ }
      else if (st === 'absent' || st === 'weekly_off' || isEmpty) lopDatesArr.push(dayNum);
      else if (st === 'present' || st === 'on_duty' || st === 'half_day' || st === 'permission') wdCount++;
      else lopDatesArr.push(dayNum);
    });

    const lopLabel = lopDatesArr.length ? `${lopDatesArr.length} (${lopDatesArr.join(', ')})` : '0';

    const doc = new jsPDF({ compress: true });

    const logo = '/assets/logo1.png';
    doc.addImage(logo, 'PNG', 14, 10, 80, 30);

    doc.setFontSize(20);
    doc.text('Payroll Summary', 200, 18, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${period}`, 200, 26, { align: 'right' });
    doc.text(`Employee: ${empName} (${empId})`, 200, 32, { align: 'right' });
    doc.text(`Department: ${department}`, 200, 38, { align: 'right' });
    doc.text(`Role: ${role}`, 200, 44, { align: 'right' });

    const permissionLabel = (empPayrollData.employeeSummary?.permissionDates || [])
      .map(dayNum => {
        const record = (empPayrollData.records || []).find(r => new Date(r.date).getUTCDate() === dayNum);
        if (record && record.permissionStartTime && record.permissionEndTime) {
          return `${dayNum} (${formatTo12Hr(record.permissionStartTime)} - ${formatTo12Hr(record.permissionEndTime)})`;
        }
        return `${dayNum}`;
      }).join(', ') || 'None';

    const tableData = [
      ['Gross Salary', `Rs. ${salary}`],
      ['Salary / Day', formatCurrency(empPayrollData.compensation?.salaryPerDay)],
      ['Salary / Hour', formatCurrency(empPayrollData.compensation?.salaryPerHour)],
      ['Earned Amount', formatCurrency(empPayrollData.compensation?.totalEarnedAmount)],
      ['Present Days', wdCount.toString()],
      ['Absent Days', lopLabel],
      ['Permission Dates', permissionLabel],
      ['Total Hours Worked', fmtMinutes(empPayrollData.compensation?.totalWorkedMinutes)],
      ['Total Hours Early Check-in', fmtMinutes(earlyMin)],
      ['Total Hours Overtime', fmtMinutes(overMin)],
      ['Total Hours Early Late', fmtMinutes(lateMin)],
    ];

    autoTable(doc, {
      startY: 56,
      head: [['Description', 'Value']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
    });

    const pageHeight = doc.internal.pageSize.height;

    // Date (bottom left)
    const currentDate = format(new Date(), 'dd MMM yyyy');
    doc.setFontSize(11);
    doc.text(`Date: ${currentDate}`, 14, pageHeight - 20);

    // Signature image (PNG)
    const signImg = '/assets/sign.png';
    doc.addImage(signImg, 'PNG', 140, pageHeight - 45, 50, 20);

    // Signature text (below image)
    doc.setFontSize(11);
    doc.text('Signature', 175, pageHeight - 20, { align: 'right' });

    if (returnBlob) {
      return doc.output('blob');
    }
    doc.save(`Payroll_${empName}_${period}.pdf`);
  };

  // ── generate PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!payrollData || !selectedEmployee || !selectedMonth) return;
    setDownloadingPDF(true);
    const tid = toast.loading('Generating PDF...');

    // Let the toast paint before jsPDF does its synchronous work.
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      buildPDF(payrollData, selectedEmployeeMeta, settings, selectedMonth);
      toast.success('PDF downloaded successfully', { id: tid });
    } catch (err) {
      toast.error('Unable to download PDF', { id: tid });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // ── send Email ────────────────────────────────────────────────────────────
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!payrollData || !selectedEmployee || !selectedMonth) return;
    const empMeta = selectedEmployeeMeta;

    setSendingEmail(true);
    const tid = toast.loading('Compressing & Generating PDF...');

    // Yield to the browser main thread so the Toast renders BEFORE the heavy synchronous jsPDF compression freezes the UI
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const pdfBlob = buildPDF(payrollData, empMeta, settings, selectedMonth, true);

      // Gmail safe attachment size limit check (~18MB max before base64 encoding)
      const sizeInMB = pdfBlob.size / (1024 * 1024);
      if (sizeInMB > 18) {
        toast.error(`PDF is too large (${sizeInMB.toFixed(1)}MB). Max safe size is 18MB for email.`, { id: tid });
        setSendingEmail(false);
        return;
      }

      toast.loading('Uploading & Sending Email...', { id: tid });
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'payroll.pdf');
      formData.append('employeeId', empMeta.employeeId || empMeta.payrollEmployeeId);
      formData.append('employeeName', empMeta.displayName || '');
      formData.append('period', `${MONTHS[selectedMonth.month - 1]} ${selectedMonth.year}`);

      await api.post('/payroll/send-email', formData);
      toast.success('Email sent successfully', { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email', { id: tid });
    } finally {
      setSendingEmail(false);
    }
  };

  // ── generate ALL employees PDFs ───────────────────────────────────────────
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAllPDFs = async () => {
    if (!selectedMonth || monthEmployees.length === 0) return;
    setDownloadingAll(true);

    const visibleEmps = [...monthEmployees]
      .filter((emp) => isVisible(emp.employeeId || emp.payrollEmployeeId))
      .sort((a, b) => Number(a.employeeId || a.payrollEmployeeId) - Number(b.employeeId || b.payrollEmployeeId));

    if (visibleEmps.length === 0) {
      toast.error('No visible employees to download');
      setDownloadingAll(false);
      return;
    }

    toast.loading(`Generating ${visibleEmps.length} PDFs...`, { id: 'all-pdfs' });
    let success = 0;
    let failed = 0;

    for (const emp of visibleEmps) {
      const empId = emp.employeeId || emp.payrollEmployeeId;
      try {
        const { data } = await api.get(`/payroll/${selectedMonth.year}/${selectedMonth.month}/${empId}`);
        const empData = data.data;
        const empSettings = {
          officeStartTime: empData.officeStartTime || '08:00',
          officeEndTime: empData.officeEndTime || '17:00',
          lunchTime: empData.lunchTime || '13:00-14:00',
        };
        buildPDF(empData, emp, empSettings, selectedMonth);
        success++;
        // Small delay so browser doesn't block multiple simultaneous downloads
        await new Promise((r) => setTimeout(r, 400));
      } catch {
        failed++;
      }
    }

    toast.dismiss('all-pdfs');
    if (failed === 0) toast.success(`${success} PDF(s) downloaded successfully`);
    else toast.error(`${success} downloaded, ${failed} failed`);
    setDownloadingAll(false);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Payroll uses attendance as its source. Edit Check In / Check Out here — changes stay in payroll only and never affect the original attendance."
      />

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[0.5fr_1fr] gap-4">
        <div className="luxury-card p-5 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-slate-600 font-medium uppercase tracking-[0.1em] mb-2 ml-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = e.target.value;
                  setSelectedYear(y);
                  const first = months.find((m) => String(m.year) === y);
                  if (first) {
                    setSelectedMonth(first);
                    setSettings({
                      officeStartTime: first.officeStartTime || '08:00',
                      officeEndTime: first.officeEndTime || '17:00',
                      lunchTime: first.lunchTime || '13:00-14:00',
                    });
                  } else {
                    setSelectedMonth(null);
                  }
                }}
                className="luxury-input !w-20"
              >
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-medium uppercase tracking-[0.1em] mb-2 ml-2">Month</label>
              <select
                value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ''}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-');
                  const found = months.find((item) => item.year === Number(y) && item.month === Number(m));
                  if (found) {
                    setSelectedMonth(found);
                    setSettings({
                      officeStartTime: found.officeStartTime || '08:00',
                      officeEndTime: found.officeEndTime || '17:00',
                      lunchTime: found.lunchTime || '13:00-14:00',
                    });
                  }
                }}
                className="luxury-input !w-32"
              >
                <option value="">Select month</option>
                {visibleMonths.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {MONTHS[m.month - 1]} {m.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs  text-slate-600 font-medium uppercase tracking-[0.1em] mb-2 ml-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="luxury-input"
              >
                <option value="">Select employee</option>
                {[...monthEmployees]
                  .sort((a, b) => {
                    const idA = a.visibilityId || a.employeeId || a.payrollEmployeeId;
                    const idB = b.visibilityId || b.employeeId || b.payrollEmployeeId;
                    return String(idA).localeCompare(String(idB), undefined, { numeric: true });
                  })
                  .map((emp) => (
                    <option
                      key={`${emp.payrollEmployeeId}-${emp.employeeId}`}
                      value={emp.payrollEmployeeId}
                    >
                      {emp.displayName} | {emp.visibilityId || emp.employeeId || emp.payrollEmployeeId}
                    </option>
                  ))}
              </select>
            </div>

          </div>
        </div>

        <div className="luxury-card p-5 mb-6">
          {/* ── Timings strip ────────────────────────────────────────────────── */}
          {selectedMonth && (
            <div className="grid md:grid-cols-[0.7fr_0.7fr_1fr_1fr_1fr] gap-4">
              {[
                { label: 'Office Start', val: settings.officeStartTime },
                { label: 'Office End', val: settings.officeEndTime },
                { label: 'Lunch Time', val: settings.lunchTime },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-3 border-r">
                  <div className="w-11 h-11 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <HiOutlineClock className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <div className="text-slate-600 text-xs font-medium uppercase tracking-[0.1em]">{label}</div>
                    <div className="text-slate-700 text-md font-semibold">
                      {label === 'Lunch Time' ? formatRangeTo12Hr(val) : formatTo12Hr(val)}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setSettingsOpen(true)}
                className="luxury-card p-4 flex items-center justify-center gap-3 
             transition-colors cursor-pointer border border-gold-500/20
             hover:bg-gold-500/5 !shadow-none"
              >
                <div className="w-11 h-11 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <HiOutlineOfficeBuilding className="w-5 h-5 text-gold-500" />
                </div>

                <div className="text-left">
                  <div className="text-slate-600 text-xs font-medium uppercase tracking-[0.1em]">
                    Settings
                  </div>
                  <div className="text-slate-700 text-lg font-semibold">
                    Payroll Settings
                  </div>
                </div>
              </button>

              {selectedMonth && monthEmployees.length > 0 && (
                <button
                  onClick={handleDownloadAllPDFs}
                  disabled={downloadingAll}
                  className="luxury-card p-4 flex items-center justify-center gap-3 
      transition-colors cursor-pointer border border-emerald-500/20
      hover:bg-emerald-500/5 !shadow-none disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <HiOutlineDownload className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="text-left">
                    <div className="text-slate-600 text-xs font-medium uppercase tracking-[0.1em]">
                      Download
                    </div>
                    <div className="text-slate-700 text-lg font-semibold">
                      {downloadingAll ? 'Generating PDFs...' : 'All PDFs'}
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

      </div>


      {/* ── Payroll detail ───────────────────────────────────────────────── */}
      {selectedEmployee && selectedMonth ? (
        loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !payrollData ? (
          <EmptyState
            icon={HiOutlineCurrencyDollar}
            title="No payroll data for this employee"
            subtitle="This month is available but this employee has no attendance-derived rows yet."
          />
        ) : (
          <div className="space-y-6">
            {/* ── Employee header ─────────────────────────────────────── */}
            <div className="luxury-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="text-slate-600 font-medium text-xs uppercase tracking-[0.1em] mb-2">
                    Payroll Snapshot
                  </div>
                  <div className="text-3xl text-slate-700">
                    {payrollData.employeeSummary?.name
                      || `${selectedEmployeeMeta?.firstName || ''} ${selectedEmployeeMeta?.lastName || ''}`.trim()}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="text-gold-600 border-r border-gray-400 pr-2">
                      ID : {selectedEmployeeMeta?.employeeId || selectedEmployee}
                    </span>
                    {selectedEmployeeMeta?.department && <span className='border-r border-gray-400 pr-2'> <span className='font-semibold'>Department</span> : {selectedEmployeeMeta.department}</span>}
                    {selectedEmployeeMeta?.role && <span className='border-r border-gray-400 pr-2'> <span className='font-semibold'>Role</span> : {selectedEmployeeMeta.role}</span>}
                    {(payrollData.employee?.salary || payrollData.employeeSummary?.salary) > 0 && (
                      <span className="text-emerald-500"><span className='font-semibold'>Salary</span> :
                        Rs. {Number(payrollData.employee?.salary || payrollData.employeeSummary?.salary || 0)
                          .toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-600 font-medium text-xs  uppercase tracking-[0.1em] mb-2">Period</div>
                  <div className="text-slate-700 text-xl font-semibold">
                    {MONTHS[selectedMonth.month - 1]} {selectedMonth.year}
                  </div>
                  <div className="text-slate-500 text-sm">
                    {payrollData.records.length} rows synced
                  </div>
                </div>
              </div>
            </div>

            {/* ── Attendance summary cards ─────────────────────────── */}
            <div className="grid md:grid-cols-5 gap-4">
              <SummaryCard label="Present Days" value={workingDaysCount} accent="green" />
              <SummaryCard label="Absent Days" value={fmtDateList(lopDates)} accent="red" />
              {/* <SummaryCard label="Casual Leave" value={clDaysCount} accent="blue" />
              <SummaryCard label="Official Leave" value={officialLeaveCount} accent="gold" /> */}
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              <SummaryCard
                label="Total Hours Worked"
                value={fmtMinutes(payrollData.compensation?.totalWorkedMinutes)}
                accent="gold"
              />
              <SummaryCard
                label="Total Hours Overtime"
                value={fmtMinutes(totalOver)}
                accent="red"
              />
              {/* <SummaryCard
                label="Payable Time"
                value={fmtMinutes(payrollData.compensation?.totalPayableMinutes)}
                accent="blue"
              /> */}

              <SummaryCard label="Salary / Day" value={formatCurrency(payrollData.compensation?.salaryPerDay)} accent="gold" />
              <SummaryCard label="Salary / Hour" value={formatCurrency(payrollData.compensation?.salaryPerHour)} accent="green" />
              <SummaryCard label="Earned Amount" value={formatCurrency(payrollData.compensation?.totalEarnedAmount)} accent="green" />
            </div>

            {/* ── Inline Analytics Grid ───────────────────────────── */}
            {payrollData && (
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="luxury-card p-6">
                  <div className=" text-xl text-slate-700 mb-4">Days Overview</div>
                  <div className="h-64">
                    <Bar data={daysChartData} options={daysChartOptions} />
                  </div>
                </div>
                <div className="luxury-card p-6">
                  <div className=" text-xl text-slate-700 mb-4">Minutes Analysis</div>
                  <div className="h-64">
                    <Bar data={minutesChartData} options={minutesChartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Daily attendance table ───────────────────────────── */}
            <div className="luxury-card overflow-hidden">
              <div className="px-6 py-5 border-b border-gold-500/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className=" text-2xl text-slate-700">Daily Attendance</div>
                  <div className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                    <HiOutlinePencil className="w-3.5 h-3.5" />
                    Hover a Check In / Check Out value and click the pencil to edit it in payroll only.
                    Attendance data is never changed.
                  </div>
                </div>
                <div className='flex gap-4'>
                  {payrollData && selectedEmployee && (
                    <>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={downloadingPDF}
                        className="btn-ghost flex items-center gap-2 text-sapphire-600 border-sapphire-600 hover:bg-sapphire-50 disabled:opacity-50"
                      >
                        <HiOutlineDownload className="w-4 h-4" />
                        {downloadingPDF ? 'Generating...' : 'Download PDF'}
                      </button>
                      <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-ghost flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-slate-100 disabled:opacity-50">
                        <HiOutlineMail className="w-4 h-4" />
                        {sendingEmail ? 'Sending...' : 'Send Email'}
                      </button>
                    </>
                  )}
                  <button onClick={loadPayroll} className="btn-ghost flex items-center gap-2">
                    <HiOutlineRefresh className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="luxury-table min-w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>
                        <span className="flex items-center gap-1">
                          Check In
                        </span>
                      </th>
                      <th>
                        <span className="flex items-center gap-1">
                          Check Out
                        </span>
                      </th>
                      <th>Status</th>
                      <th>Permission</th>
                      <th>Worked</th>
                      <th>Payable</th>
                      <th>Early CheckIn</th>
                      <th>Late</th>
                      <th>Overtime</th>
                      <th>Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.records.map((row) => {
                      const dateStr = format(new Date(row.date), 'yyyy-MM-dd');
                      const isSaving = savingRecord === dateStr;

                      const toMinutes = (time) => {
                        if (!time || time === '--') return null;
                        const [h, m] = time.split(':').map(Number);
                        return h * 60 + m;
                      };

                      const officeStart = toMinutes(settings.officeStartTime); // 10:00
                      const officeEnd = toMinutes(settings.officeEndTime);   // 19:00

                      const checkIn = toMinutes(row.checkIn);
                      const checkOut = toMinutes(row.checkOut);

                      //Early CheckIn
                      const isSunday = new Date(row.date).getDay() === 0;

                      const isMissing = checkIn === null || checkOut === null;

                      // Early CheckIn
                      const earlyCheckin = !isSunday && !isMissing && checkIn < officeStart
                        ? officeStart - checkIn
                        : 0;

                      // Late coming
                      const lateMinutes = !isSunday && !isMissing && checkIn > officeStart
                        ? checkIn - officeStart
                        : 0;

                      // Overtime
                      const overMinutes = !isSunday && !isMissing && checkOut > officeEnd
                        ? checkOut - officeEnd
                        : 0;

                      return (
                        <tr key={`${row.employeeId}-${row.date}`} className={isSaving ? 'opacity-60' : ''}>
                          <td className=" text-slate-600 text-xs">
                            {format(new Date(row.date), 'dd MMM yyyy')}
                          </td>
                          <td className="text-slate-500 text-xs">
                            {format(new Date(row.date), 'EEEE')}
                          </td>

                          {/* ── Editable Check In ── */}
                          <td>
                            <TimeEditCell
                              value={row.checkIn}
                              accent="green"
                              onSave={(val) => saveRecordTime(dateStr, 'checkIn', val)}
                            />
                          </td>

                          {/* ── Editable Check Out ── */}
                          <td>
                            <TimeEditCell
                              value={row.checkOut}
                              accent="red"
                              onSave={(val) => saveRecordTime(dateStr, 'checkOut', val)}
                            />
                          </td>
                          <td>
                            <StatusEditCell
                              value={isSunday ? 'weekly_off' : row.status}
                              disabled={isSunday}
                              onSave={(val) => saveRecordTime(dateStr, 'status', val)}
                            />
                          </td>

                          <td className="!text-[11px] font-medium">
                            {row.status === 'permission' ? (
                              <PermissionTimeRange row={row} />
                            ) : (
                              <span className="text-amber-500">—</span>
                            )}
                          </td>

                          <td className=" text-slate-600 text-xs">
                            {fmtMinutes(row.workedMinutes)}
                          </td>
                          <td className=" text-slate-600 text-xs">
                            {formatCurrency(payrollData.compensation?.salaryPerDay)}
                          </td>
                          <td className="text-yellow-500  text-xs">
                            {earlyCheckin ? fmtMinutes(earlyCheckin) : '—'}
                          </td>
                          <td className="text-yellow-500  text-xs">
                            {lateMinutes ? fmtMinutes(lateMinutes) : '—'}
                          </td>
                          <td className="text-yellow-500  text-xs">
                            {overMinutes ? fmtMinutes(overMinutes) : '—'}
                          </td>
                          <td className=" text-emerald-500 text-xs">
                            {formatCurrency(row.earnedAmount || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : months.length > 0 ? (
        <EmptyState
          icon={HiOutlineCurrencyDollar}
          title="Choose month and employee"
          subtitle="Payroll is generated from attendance. Pick a month and employee to view or edit."
        />
      ) : (
        <EmptyState
          icon={HiOutlineCurrencyDollar}
          title="No payroll months available yet"
          subtitle="Upload attendance first. Payroll months are created automatically."
        />
      )}

      {/* ── Settings modal ───────────────────────────────────────────────── */}
      {/* ── Global Settings modal ─────────────────────────────────────────── */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Payroll Settings">
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Office Start Time">
              <div className="relative group">
                <input
                  type="time"
                  value={globalSettings.officeStartTime}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, officeStartTime: e.target.value })}
                  className="luxury-input w-full"
                />
                {globalSettings.officeStartTime && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                    {formatTo12Hr(globalSettings.officeStartTime)}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Office End Time">
              <div className="relative group">
                <input
                  type="time"
                  value={globalSettings.officeEndTime}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, officeEndTime: e.target.value })}
                  className="luxury-input w-full"
                />
                {globalSettings.officeEndTime && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                    {formatTo12Hr(globalSettings.officeEndTime)}
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="Lunch Time (e.g. 13:00-14:00)">
            <div className="relative group">
              <input
                value={globalSettings.lunchTime}
                onChange={(e) => setGlobalSettings({ ...globalSettings, lunchTime: e.target.value })}
                className="luxury-input w-full"
                placeholder="13:00-14:00"
              />
              {globalSettings.lunchTime && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-gold-500 font-medium bg-obsidian-900 px-2 py-0.5 rounded border border-gold-500/20 shadow-sm pointer-events-none transition-opacity group-hover:opacity-100">
                  {formatRangeTo12Hr(globalSettings.lunchTime)}
                </div>
              )}
            </div>
          </Field>

          <div className="text-sm text-slate-500">
            These settings are global and will apply to any <b>upcoming</b> payroll generations.
            Previous months remain unchanged.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
            <button onClick={() => setSettingsOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={saveGlobalSettings} className="btn-gold">Save Global Settings</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
