"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import {
  Settings, Clock, FileText, Eye, Plus, Edit, Trash2,
  ToggleLeft, ToggleRight, FileSpreadsheet, Search, Download, Check, X,
  CheckCircle, XCircle, Clock8, Award, AlertOctagon,
  CalendarDays, MapPin, ChevronDown, ChevronUp, Lightbulb,AlertCircle
} from "lucide-react";
import Ainput from "@/components/atoms/Input";
import { useCurrentUser } from "@/app/hooks/use-current-user";

type ShiftData = {
  Misc_Code: string;
  MISC_NAME: string;
  Misc_Add1: string;
  Misc_Add2: string;
  Misc_Add3?: string;
  Misc_Add4?: string;
  Misc_Add5?: string;
};
type RegionData = {
  Misc_Code: string;
  MISC_NAME: string;
  Misc_Add1: string;
  Misc_Add2: string;
};

type StatusMasterData = {
  Desc: string;
  Early_Go: string;
  Late_Come: string;
  Allow_Days: string;
  Priority_Code: string;
  Region: string;
  HALF: string | null;
  HALF_VAL: string | null;
  WEF: string;
  ABSENT: string | null;
};

type AttendancePolicyData = {
  // Basic Info
  policyName: string;
  effectiveFrom: string;
  effectiveTo: string;
  description: string;
  isActive: boolean;
  location: string[];
  employeeTypes: string[];

  // Shift Rules
  shiftCode: string;
  shiftType: string;
  breakDuration: string;
  breakType: string;
  workingHours: string;
  weeklyWorkingDays: string[];

  // Overtime Rules
  overtimeAllowed: boolean;
  overtimeRate: string;
  maxOvertimePerDay: string;
  maxOvertimePerMonth: string;
  overtimeCompensatoryOff: boolean;
  compOffValidityDays: string;
  maxCompOffBalance: string;
  minimumHoursForCompOff: string;

  // Missing Punch Rules
  missingPunchAllowed: boolean;
  regularizationAllowed: boolean;
  regularizationPeriod: string;
  regularizationMaxDays: string;
  regularizationDocumentRequired: boolean;

  // Weekly Off Rules
  weeklyOffPattern: string;
  weeklyOffDays: string[];
  weeklyOffAlternative: boolean;
  weeklyOffCompensatory: boolean;
  enableSandwichPolicy: boolean;
  holidayList: string[];

  // Geofencing & Device Rules
  enableGeoFence: boolean;
  allowedRadius: string;
  latitude: string;
  longitude: string;
  allowMobilePunch: boolean;
  allowWebPunch: boolean;
  allowBiometricPunch: boolean;
  allowFaceRecognition: boolean;
  attendanceSourcePriority: string;

  // Status Rules
  statusRules: StatusMasterData[];
};

type PolicyTableData = {
  id: string;
  policyName: string;
  shiftType: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "draft";
  assignedEmployees: number;
};
type HardcodedPolicy = {
  UTD: string;
  POLICY_NAME: string;
  POLICY_DESC: string;
  IS_ENABLED: boolean;
};

export default function AttendancePolicySetup() {
  const user = useCurrentUser();
  const [view, setView] = useState<"list" | "form">("list");
  const [expandedTab, setExpandedTab] = useState<string | null>("basic");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyTableData, setPolicyTableData] = useState<PolicyTableData[]>([]);
  const [policyLogs, setPolicyLogs] = useState<any[]>([]);
// Update the state initialization
const [hardcodedPolicies, setHardcodedPolicies] = useState<HardcodedPolicy[]>([]);
const [loadingPolicies, setLoadingPolicies] = useState(false);

// Add a function to fetch predefined policies
const fetchPredefinedPolicies = async () => {
  if (!user?.Comp_Code) return;
  setLoadingPolicies(true);
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/admin/getPredefinedPolicies`,
      {},
      { headers: { compcode: user.Comp_Code, name: user.name } }
    );
    if (response.data.success) {
      setHardcodedPolicies(response.data.data || []);
    }
  } catch (error) {
    console.error("Error fetching predefined policies:", error);
  } finally {
    setLoadingPolicies(false);
  }
};



  const [formData, setFormData] = useState<AttendancePolicyData>({
    policyName: "",
    effectiveFrom: "",
    effectiveTo: "",
    description: "",
    isActive: true,
    location: [],
    employeeTypes: [],

    shiftCode: "",
    shiftType: "",
    breakDuration: "",
    breakType: "",
    workingHours: "",
    weeklyWorkingDays: [],

    overtimeAllowed: true,
    overtimeRate: "",
    maxOvertimePerDay: "",
    maxOvertimePerMonth: "",
    overtimeCompensatoryOff: true,
    compOffValidityDays: "",
    maxCompOffBalance: "",
    minimumHoursForCompOff: "",

    missingPunchAllowed: true,
    regularizationAllowed: true,
    regularizationPeriod: "",
    regularizationMaxDays: "",
    regularizationDocumentRequired: true,

    weeklyOffPattern: "",
    weeklyOffDays: [],
    weeklyOffAlternative: true,
    weeklyOffCompensatory: true,
    enableSandwichPolicy: true,
    holidayList: [],

    enableGeoFence: false,
    allowedRadius: "",
    latitude: "",
    longitude: "",
    allowMobilePunch: true,
    allowWebPunch: true,
    allowBiometricPunch: true,
    allowFaceRecognition: false,
    attendanceSourcePriority: "",

   statusRules: [
  {
    Desc: "P",
    Early_Go: "",
    Late_Come: "",
    Allow_Days: "",
    Priority_Code: "",
    Region: "",
    HALF: null,
    HALF_VAL: null,
    WEF: "",
    ABSENT: null,
  },
  {
    Desc: "HLF",
    Early_Go: "",
    Late_Come: "",
    Allow_Days: "",
    Priority_Code: "",
    Region: "",
    HALF: null,
    HALF_VAL: null,
    WEF: "",
    ABSENT: null,
  }
]
  });

 const tabs = [
  { id: "basic", label: "Basic", icon: Settings, proTip: "Define policy name, dates, and basic settings", color: "text-primary" },
  { id: "statusrules", label: "Status Rules", icon: FileText, proTip: "Configure attendance status rules with Early/Late values", color: "text-[#67E8F9]" },
  { id: "hardcodedpolicies", label: "Predefined Rules", icon: FileText, proTip: "Enable/disable Predefined Rules", color: "text-yellow" }, // NEW
  { id: "shift", label: "Shift & Working Hours", icon: Clock8, proTip: "Configure shift, working hours and breaks", color: "text-yellow" },
  { id: "overtime", label: "Overtime & Comp Off", icon: Award, proTip: "Set overtime rates and compensatory off rules", color: "text-green" },
  { id: "misspunch", label: "Missing Punch", icon: AlertOctagon, proTip: "Define missing punch and regularization rules", color: "text-[#F472B6]" },
  { id: "weeklyoff", label: "Weekly Off & Holidays", icon: CalendarDays, proTip: "Configure weekly off, holidays and sandwich policy", color: "text-[#34D399]" },
  { id: "geofencing", label: "Geofencing & Devices", icon: MapPin, proTip: "Set GPS location and device restrictions", color: "text-[#D8B4FE]" },
];

  const proTips: Record<string, { title: string; tips: string[] }> = {
    basic: {
      title: "Basic Configuration",
      tips: [
        "📝 Choose a descriptive policy name",
        "📅 Set effective dates for the policy",
        "📍 Select applicable locations and employee types"
      ]
    },
    statusrules: {
      title: "Status Rules",
      tips: [
        "📋 'P' (Present) and 'HLF' (Half Day) are mandatory",
        "📊 Priority determines which rule applies first (Lower number = Higher priority)",
        "⏱️ Early_Go and Late_Come are in minutes",
        "📅 Allow_Days = Number of days allowed per month"
      ]
    },
    hardcodedpolicies: {
  title: "Predefined Rules",
  tips: [
    "📋 Toggle ON/OFF to enable/disable each policy",
    "📝 Each policy represents a specific attendance rule",
    "🔧 Enable only the policies that apply to your organization"
  ]
},
    shift: {
      title: "Shift & Working Hours",
      tips: [
        "🕐 Select the appropriate shift from dropdown",
        "⏰ Set working hours and break duration",
        "📅 Select weekly working days"
      ]
    },
    overtime: {
      title: "Overtime & Comp Off",
      tips: [
        
        "📅 Configure comp off validity (e.g., 60 days)",
        "⚖️ Set daily and monthly overtime limits"
      ]
    },
    misspunch: {
      title: "Missing Punch & Regularization",
      tips: [
        "📝 Enable regularization to allow employees to correct attendance",
        "📅 Define regularization period (e.g., 7 days)",
        "📎 Require document submission for regularization"
      ]
    },
    weeklyoff: {
      title: "Weekly Off & Holidays",
      tips: [
        "📅 Configure weekly off pattern (Fixed or Rotational)",
        "📌 Select appropriate weekly off days",
        "🥪 Enable sandwich policy for absences around off days"
      ]
    },
    geofencing: {
      title: "Geofencing & Devices",
      tips: [
        "📍 Enable GPS location tracking",
        "📱 Configure allowed devices: Mobile, Web, Biometric, Face Recognition",
        "⚡ Set attendance source priority"
      ]
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchLocations();
    fetchPolicies();
    fetchPredefinedPolicies();
  }, []);

 const fetchShifts = async () => {
  if (!user?.Comp_Code) return;
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/admin/getShifts`,
      {},
      { headers: { compcode: user.Comp_Code, name: user.name } }
    );
    if (response.data.success) {
      setShifts(response.data.data || []);
      setRegions(response.data.regions || []);
    }
  } catch (error) { console.error("Error fetching data:", error); }
};

  const fetchLocations = async () => {
    if (!user?.Comp_Code) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/All`,
        { branch: user?.branch || "" },
        { headers: { compcode: user.Comp_Code, name: user.name } }
      );
      if (response.data && response.data.success) {
        let locationData = [];
        if (response.data.Location) {
          if (Array.isArray(response.data.Location)) locationData = response.data.Location;
          else locationData = [response.data.Location];
        }
        setLocations(locationData);
      } else setLocations([]);
    } catch (error) { console.error("Error fetching locations:", error); setLocations([]); }
  };

  const fetchPolicies = async () => {
    if (!user?.Comp_Code) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getAttendancePolicies`,
        {},
        { headers: { compcode: user.Comp_Code, name: user.name } }
      );
      if (response.data.success) setPolicyTableData(response.data.data || []);
    } catch (error) { console.error("Error fetching policies:", error); }
    finally { setLoading(false); }
  };

  const fetchPolicyById = async (policyId: string) => {
    const result = await Swal.fire({
      icon: "info",
      title: "Edit Policy",
      text: "Are you sure you want to edit this policy?",
      confirmButtonText: "Yes, Edit",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
    });
    if (!result.isConfirmed) return;

    setView("form");
    setEditingPolicy(policyId);
    setExpandedTab("basic");
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getAttendancePolicyById`,
        { policyId },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );

      if (response.data.success) {
        const policy = response.data.data;
        const toBoolean = (value: any): boolean => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') return value === 1;
          if (typeof value === 'string') return value === '1' || value === 'true';
          return false;
        };

        let weeklyWorkingDays = policy.weeklyWorkingDays || [];
        if (typeof weeklyWorkingDays === 'string') weeklyWorkingDays = weeklyWorkingDays.split(',');

        let weeklyOffDays = policy.weeklyOffDays || [];
        if (typeof weeklyOffDays === 'string') weeklyOffDays = weeklyOffDays.split(',');

        let location = policy.location || [];
        if (typeof location === 'string') location = location.split(',');

        let employeeTypes = policy.employeeTypes || [];
        if (typeof employeeTypes === 'string') employeeTypes = employeeTypes.split(',');

        let holidayList = policy.holidayList || [];
        if (typeof holidayList === 'string') holidayList = holidayList.split(',');

        let statusRules = policy.statusRules || [];
        if (typeof statusRules === 'string') statusRules = JSON.parse(statusRules);

        setFormData({
          policyName: policy.policyName || '',
          effectiveFrom: policy.effectiveFrom ? new Date(policy.effectiveFrom).toISOString().split('T')[0] : '',
          effectiveTo: policy.effectiveTo ? new Date(policy.effectiveTo).toISOString().split('T')[0] : '',
          description: policy.description || '',
          isActive: toBoolean(policy.isActive),
          location: location,
          employeeTypes: employeeTypes,

          shiftCode: policy.shiftCode || '',
          shiftType: policy.shiftType || '',
          breakDuration: policy.breakDuration || '',
          breakType: policy.breakType || '',
          workingHours: policy.workingHours || '',
          weeklyWorkingDays: weeklyWorkingDays,

          overtimeAllowed: toBoolean(policy.overtimeAllowed),
          overtimeRate: policy.overtimeRate || '',
          maxOvertimePerDay: policy.maxOvertimePerDay || '',
          maxOvertimePerMonth: policy.maxOvertimePerMonth || '',
          overtimeCompensatoryOff: toBoolean(policy.overtimeCompensatoryOff),
          compOffValidityDays: policy.compOffValidityDays || '',
          maxCompOffBalance: policy.maxCompOffBalance || '',
          minimumHoursForCompOff: policy.minimumHoursForCompOff || '',

          missingPunchAllowed: toBoolean(policy.missingPunchAllowed),
          regularizationAllowed: toBoolean(policy.regularizationAllowed),
          regularizationPeriod: policy.regularizationPeriod || '',
          regularizationMaxDays: policy.regularizationMaxDays || '',
          regularizationDocumentRequired: toBoolean(policy.regularizationDocumentRequired),

          weeklyOffPattern: policy.weeklyOffPattern || '',
          weeklyOffDays: weeklyOffDays,
          weeklyOffAlternative: toBoolean(policy.weeklyOffAlternative),
          weeklyOffCompensatory: toBoolean(policy.weeklyOffCompensatory),
          enableSandwichPolicy: toBoolean(policy.enableSandwichPolicy),
          holidayList: holidayList,

          enableGeoFence: toBoolean(policy.enableGeoFence),
          allowedRadius: policy.allowedRadius || '',
          latitude: policy.latitude || '',
          longitude: policy.longitude || '',
          allowMobilePunch: toBoolean(policy.allowMobilePunch),
          allowWebPunch: toBoolean(policy.allowWebPunch),
          allowBiometricPunch: toBoolean(policy.allowBiometricPunch),
          allowFaceRecognition: toBoolean(policy.allowFaceRecognition),
          attendanceSourcePriority: policy.attendanceSourcePriority || '',

          statusRules: statusRules || [
            {
              Desc: "P",
              Early_Go: "",
              Late_Come: "",
              Allow_Days: "",
              Priority_Code: "",
              Region: "",
              HALF: null,
              HALF_VAL: null,
              WEF: new Date().toISOString().split('T')[0],
              ABSENT: null,
            },
            {
              Desc: "HLF",
              Early_Go: "",
              Late_Come: "",
              Allow_Days: "",
              Priority_Code: "",
              Region: "",
              HALF: null,
              HALF_VAL: null,
              WEF: new Date().toISOString().split('T')[0],
              ABSENT: null,
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
      Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to load policy details' });
    } finally { setLoading(false); }
  };

  const deletePolicy = async (policyId: string, policyName: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `You are about to delete "${policyName}" policy`,
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_URL}/admin/deleteAttendancePolicy`,
          { policyId },
          { headers: { compcode: user?.Comp_Code, name: user?.name } }
        );
        if (response.data.success) {
          setPolicyTableData(prev => prev.filter(p => p.id !== policyId));
          Swal.fire({ icon: 'success', title: 'Deleted!', text: `"${policyName}" has been deleted.`, timer: 2000, showConfirmButton: false });
        } else throw new Error(response.data.message || 'Failed to delete policy');
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Error!', text: error?.response?.data?.message || 'Failed to delete policy.' });
      } finally { setLoading(false); }
    }
  };

  const fetchPolicyLogs = async () => {
    if (!editingPolicy) {
      Swal.fire({ icon: 'warning', title: 'No Policy Selected', text: 'Please select a policy to view logs' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/admin/getAttendancePolicyHistory`,
        { policyId: editingPolicy },
        { headers: { compcode: user?.Comp_Code, name: user?.name } }
      );
      if (response.data.success) {
        setPolicyLogs(response.data.data || []);
        setShowLogModal(true);
      } else throw new Error(response.data.message || 'Failed to load history');
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error?.response?.data?.message || 'Unable to load history' });
    } finally { setLoading(false); }
  };
  // Validate unique priority codes
const validateUniquePriority = () => {
  const priorityCodes = formData.statusRules
    .filter(
      rule =>
        rule.Priority_Code !== null &&
        rule.Priority_Code !== undefined &&
        String(rule.Priority_Code).trim() !== ''
    )
    .map(rule => String(rule.Priority_Code));

  const uniquePriorities = new Set(priorityCodes);

  if (priorityCodes.length !== uniquePriorities.size) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Priority!',
      text: 'Each status rule must have a unique Priority Code.',
      confirmButtonColor: '#EF4444',
    });
    return false;
  }

  return true;
};

  const saveAttendancePolicy = async () => {
    const requiredFields = [
      { field: 'policyName', label: 'Policy Name' },
      { field: 'effectiveFrom', label: 'Start Date' },
      { field: 'effectiveTo', label: 'End Date' },
      { field: 'shiftCode', label: 'Shift' },
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof AttendancePolicyData]) {
        Swal.fire({ icon: 'warning', title: 'Missing Field!', text: `${label} is required.` });
        return;
      }
    }

    if (formData.location.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Missing Field!', text: 'Please select at least one location.' });
      return;
    }

    // Validate status rules have at least P and HLF
    const hasP = formData.statusRules.some(r => r.Desc === 'P');
    const hasHLF = formData.statusRules.some(r => r.Desc === 'HLF');
    if (!hasP || !hasHLF) {
      Swal.fire({ icon: 'warning', title: 'Missing Status Rules!', text: 'P (Present) and HLF (Half Day) rules are required.' });
      return;
    }
    if (!validateUniquePriority()) {
    return;
  }

    setLoading(true);

    try {
      const selectedPolicies = hardcodedPolicies
      .filter(policy => policy.IS_ENABLED)
      .map(policy => ({
        UTD: policy.UTD,
        POLICY_NAME: policy.POLICY_NAME,
        POLICY_DESC: policy.POLICY_DESC,
        IS_ENABLED: policy.IS_ENABLED
      }));
      const payload = {
  formData: {
    ...formData,
    predefinedRules: selectedPolicies,
    UTD: editingPolicy || undefined,
  },
  policyId: editingPolicy || undefined,
};

      const url = editingPolicy
        ? `${process.env.NEXT_PUBLIC_URL}/admin/updateAttendancePolicy`
        : `${process.env.NEXT_PUBLIC_URL}/admin/saveAttendancePolicy`;

      const response = await axios({
        method: 'POST',
        url: url,
        data: payload,
        headers: { compcode: user?.Comp_Code, name: user?.name },
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message,
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          setView('list');
          setEditingPolicy(null);
          resetForm();
          fetchPolicies();
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: response.data.message || 'Failed to save policy' });
      }
    } catch (error: any) {
      console.error('Error saving attendance policy:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error?.response?.data?.message || 'Something went wrong!' });
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({
      policyName: "",
      effectiveFrom: "",
      effectiveTo: "",
      description: "",
      isActive: true,
      location: [],
      employeeTypes: [],

      shiftCode: "",
      shiftType: "",
      breakDuration: "",
      breakType: "",
      workingHours: "",
      weeklyWorkingDays: [],

      overtimeAllowed: true,
      overtimeRate: "",
      maxOvertimePerDay: "",
      maxOvertimePerMonth: "",
      overtimeCompensatoryOff: true,
      compOffValidityDays: "",
      maxCompOffBalance: "",
      minimumHoursForCompOff: "",

      missingPunchAllowed: true,
      regularizationAllowed: true,
      regularizationPeriod: "",
      regularizationMaxDays: "",
      regularizationDocumentRequired: true,

      weeklyOffPattern: "",
      weeklyOffDays: [],
      weeklyOffAlternative: true,
      weeklyOffCompensatory: true,
      enableSandwichPolicy: true,
      holidayList: [],

      enableGeoFence: false,
      allowedRadius: "",
      latitude: "",
      longitude: "",
      allowMobilePunch: true,
      allowWebPunch: true,
      allowBiometricPunch: true,
      allowFaceRecognition: false,
      attendanceSourcePriority: "",

      statusRules: [
        {
          Desc: "P",
          Early_Go: "",
          Late_Come: "",
          Allow_Days: "",
          Priority_Code: "",
          Region: "",
          HALF: null,
          HALF_VAL: null,
          WEF: new Date().toISOString().split('T')[0],
          ABSENT: null,
        },
        {
          Desc: "HLF",
          Early_Go: "",
          Late_Come: "",
          Allow_Days: "",
          Priority_Code: "",
          Region: "",
          HALF: null,
          HALF_VAL: null,
          WEF: new Date().toISOString().split('T')[0],
          ABSENT: null,
        }
      ]
    });
  };

  // Status Rules Functions
const addStatusRule = () => {
  setFormData({
    ...formData,
    statusRules: [
      ...formData.statusRules,
      {
        Desc: "",
        Early_Go: "",
        Late_Come: "",
        Allow_Days: "",
        Priority_Code: "",
        Region: "",
        HALF: null,
        HALF_VAL: null,
        WEF: new Date().toISOString().split('T')[0],
        ABSENT: null,
      }
    ]
  });
};

  const removeStatusRule = (index: number) => {
    const rule = formData.statusRules[index];
    if (rule.Desc === 'P' || rule.Desc === 'HLF') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'P (Present) and HLF (Half Day) rules are mandatory and cannot be deleted.'
      });
      return;
    }
    const newRules = formData.statusRules.filter((_, i) => i !== index);
    setFormData({ ...formData, statusRules: newRules });
  };

  const updateStatusRule = (index: number, field: keyof StatusMasterData, value: any) => {
    const newRules = [...formData.statusRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setFormData({ ...formData, statusRules: newRules });
  };

  const renderToggle = (value: boolean, onChange: () => void) => {
    return (
      <button onClick={onChange} className="focus:outline-none transition-all hover:scale-105">
        {value ? <ToggleRight className="w-10 h-10 text-primary" /> : <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-600" />}
      </button>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return "Not set";
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green dark:bg-green', icon: CheckCircle },
      inactive: { color: 'bg-exit dark:bg-exit', icon: XCircle },
      draft: { color: 'bg-yellow dark:bg-yellow', icon: AlertCircle }
    };
    const { color, icon: Icon } = config[status as keyof typeof config] || config.draft;
    return (
      <span className={`inline-flex text-white items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const inputClass = "w-full border border-borderColor dark:border-borderColor-dark rounded-lg px-4 py-2 bg-white dark:bg-dark text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all";

  const toggleTab = (tabId: string) => {
    setExpandedTab(expandedTab === tabId ? null : tabId);
  };

  const getPreviewData = () => {
    const selectedShift = shifts.find(s => s.Misc_Code === formData.shiftCode);
    const shiftDisplay = selectedShift ? `${selectedShift.MISC_NAME} (${selectedShift.Misc_Add1 || ''} - ${selectedShift.Misc_Add2 || ''})` : 'Not selected';

    // Create status rules preview
    const statusRulesPreview: Record<string, string> = {};
    formData.statusRules.forEach((rule, index) => {
      statusRulesPreview[`Rule ${index + 1}`] = 
        `${rule.Desc}: Early=${rule.Early_Go || '0'}min, Late=${rule.Late_Come || '0'}min, Priority=${rule.Priority_Code || 'N/A'}, Days=${rule.Allow_Days || 'N/A'}`;
    });

    return {
      'Basic Information': {
        'Policy Name': formData.policyName || 'Not set',
        'Start Date': formatDate(formData.effectiveFrom),
        'End Date': formatDate(formData.effectiveTo),
        'Status': formData.isActive ? 'Active' : 'Inactive',
        'Location': formData.location.length > 0 ? formData.location.join(', ') : 'Not selected',
        'Employee Types': formData.employeeTypes.length > 0 ? formData.employeeTypes.join(', ') : 'All',
        'Description': formData.description || 'No description provided'
      },
      'Status Rules': statusRulesPreview,
      'Shift & Working Hours': {
        'Shift': shiftDisplay,
        'Shift Type': formData.shiftType || 'Not set',
        'Working Hours': (formData.workingHours || '0') + ' hours',
        'Break Duration': (formData.breakDuration || '0') + ' minutes',
        'Break Type': formData.breakType || 'Not set',
        'Weekly Working Days': formData.weeklyWorkingDays.length > 0 ? formData.weeklyWorkingDays.join(', ') : 'Not set',
      },
      'Overtime & Comp Off': {
        'Overtime Allowed': formData.overtimeAllowed ? 'Yes' : 'No',
        'Overtime Rate': (formData.overtimeRate || '0') + 'x',
        'Max Overtime Per Day': (formData.maxOvertimePerDay || '0') + ' hours',
        'Max Overtime Per Month': (formData.maxOvertimePerMonth || '0') + ' hours',
        'Comp Off Allowed': formData.overtimeCompensatoryOff ? 'Yes' : 'No',
        'Comp Off Validity': (formData.compOffValidityDays || '0') + ' days',
        'Max Comp Off Balance': formData.maxCompOffBalance || '0',
        'Min Hours for Comp Off': (formData.minimumHoursForCompOff || '0') + ' hours',
      },
      'Missing Punch & Regularization': {
        'Missing Punch Allowed': formData.missingPunchAllowed ? 'Yes' : 'No',
        'Regularization Allowed': formData.regularizationAllowed ? 'Yes' : 'No',
        'Regularization Period': (formData.regularizationPeriod || '0') + ' days',
        'Max Days to Regularize': formData.regularizationMaxDays || '0',
        'Document Required': formData.regularizationDocumentRequired ? 'Yes' : 'No',
      },
      'Weekly Off & Holidays': {
        'Weekly Off Pattern': formData.weeklyOffPattern || 'Not set',
        'Weekly Off Days': formData.weeklyOffDays.length > 0 ? formData.weeklyOffDays.join(', ') : 'Not set',
        'Alternative Off': formData.weeklyOffAlternative ? 'Yes' : 'No',
        'Comp Off': formData.weeklyOffCompensatory ? 'Yes' : 'No',
        'Sandwich Policy': formData.enableSandwichPolicy ? 'Enabled' : 'Disabled',
        'Holiday List': formData.holidayList.length > 0 ? formData.holidayList.join(', ') : 'Not set',
      },
      'Geofencing & Devices': {
        'Geo Fence': formData.enableGeoFence ? 'Enabled' : 'Disabled',
        'Allowed Radius': (formData.allowedRadius || '0') + ' meters',
        'Latitude': formData.latitude || 'Not set',
        'Longitude': formData.longitude || 'Not set',
        'Mobile Punch': formData.allowMobilePunch ? 'Allowed' : 'Not Allowed',
        'Web Punch': formData.allowWebPunch ? 'Allowed' : 'Not Allowed',
        'Biometric Punch': formData.allowBiometricPunch ? 'Allowed' : 'Not Allowed',
        'Face Recognition': formData.allowFaceRecognition ? 'Allowed' : 'Not Allowed',
        'Source Priority': formData.attendanceSourcePriority || 'Not set',
      }
    };
  };

  const renderTabContent = () => {
    switch (expandedTab) {
      case "basic":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Ainput
                title="Policy Name"
                type="text"
                name="policyName"
                value={formData.policyName}
                handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })}
                placeholder="e.g., Standard Attendance Policy"
                redlabel="*"
              />
              <Ainput
                title="Description"
                type="textarea"
                name="description"
                value={formData.description}
                handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })}
                rows={3}
                placeholder="Enter policy description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Ainput
                title="Start Date"
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })}
                redlabel="*"
              />
              <Ainput
                title="End Date"
                type="date"
                name="effectiveTo"
                value={formData.effectiveTo}
                handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })}
                redlabel="*"
              />
            </div>
<div>
              <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase">Select Shift <span className="text-red-500">*</span></label>
              <select 
                value={formData.shiftCode} 
                onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value })} 
                className={inputClass}
              >
                <option value="">Select Shift</option>
                {shifts.map((shift) => (
                  <option key={shift.Misc_Code} value={shift.Misc_Code}>
                    {shift.MISC_NAME} ({shift.Misc_Add1 || ''} - {shift.Misc_Add2 || ''})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-header dark:text-white mb-3 uppercase tracking-wider">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const allLocationValues = locations.map(loc => loc.value);
                    const allSelected = allLocationValues.every(val => formData.location.includes(val));
                    if (allSelected) setFormData({ ...formData, location: [] });
                    else setFormData({ ...formData, location: allLocationValues });
                  }}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  {locations.length > 0 && locations.every(val => formData.location.includes(val.value)) ? (
                    <><Check className="w-4 h-4" /> Deselect All</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Select All ({locations.length})</>
                  )}
                </button>
              </div>
              <div className="border border-borderColor dark:border-borderColor-dark rounded-lg p-2 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {locations.map((loc) => (
                    <label key={loc.value} className={`flex items-center gap-2 p-2 bg-off dark:bg-dark border-2 rounded-md cursor-pointer hover:border-primary transition-all ${formData.location.includes(loc.value) ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                      <input type="checkbox" checked={formData.location.includes(loc.value)} onChange={() => {
                        if (formData.location.includes(loc.value)) setFormData({ ...formData, location: formData.location.filter(v => v !== loc.value) });
                        else setFormData({ ...formData, location: [...formData.location, loc.value] });
                      }} className="w-4 h-4 accent-primary cursor-pointer flex-shrink-0" />
                      <span className="text-sm font-semibold text-black dark:text-white truncate">{loc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-header dark:text-white mb-3 uppercase tracking-wider">
                Employee Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['regular', 'casual', 'apprentice'].map((type) => (
                  <label key={type} className={`flex items-center gap-2 p-2 bg-off dark:bg-dark border-2 rounded-md cursor-pointer hover:border-primary transition-all ${formData.employeeTypes.includes(type) ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                    <input type="checkbox" checked={formData.employeeTypes.includes(type)} onChange={() => {
                      if (formData.employeeTypes.includes(type)) setFormData({ ...formData, employeeTypes: formData.employeeTypes.filter(t => t !== type) });
                      else setFormData({ ...formData, employeeTypes: [...formData.employeeTypes, type] });
                    }} className="w-4 h-4 accent-primary cursor-pointer flex-shrink-0" />
                    <span className="text-sm font-semibold text-black dark:text-white capitalize">{type}</span>
                  </label>
                ))}
              </div>
             
            </div>

         
          </div>
        );

      case "statusrules":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-header dark:text-white uppercase tracking-wider">Status Rules</h3>
              <Button onClick={addStatusRule} variant="save" className="text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> 
              </Button>
            </div>

            <div className="overflow-x-auto border border-borderColor dark:border-borderColor-dark rounded-lg">
              <table className="w-full">
               <thead>
  <tr className="bg-off dark:bg-dark/50 border-b border-borderColor dark:border-borderColor-dark">
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">#</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Desc</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Early Go </th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Late Come </th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Allow Days</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">HALF</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">HALF_VAL</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Priority</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Region</th>
    <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Actions</th>
  </tr>
</thead>
               <tbody className="divide-y divide-borderColor dark:divide-borderColor-dark">
  {formData.statusRules.map((rule, index) => (
    <tr key={index} className="hover:bg-off/50 dark:hover:bg-dark/30 transition-colors">
      <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
      
      {/* Desc */}
      <td className="px-4 py-2">
        {(rule.Desc === 'P' || rule.Desc === 'HLF') && formData.statusRules.length <= 2 ? (
          <span className="font-bold text-primary">{rule.Desc}</span>
        ) : (
          <input
            type="text"
            value={rule.Desc || ''}
            onChange={(e) => updateStatusRule(index, 'Desc', e.target.value.toUpperCase())}
            className={`${inputClass} w-20`}
            placeholder="e.g., L"
            maxLength={5}
          />
        )}
      </td>
      
      {/* Early_Go */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={rule.Early_Go || ''}
          onChange={(e) => updateStatusRule(index, 'Early_Go', e.target.value)}
          className={`${inputClass} w-20`}
          
          min="0"
        />
      </td>
      
      {/* Late_Come */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={rule.Late_Come || ''}
          onChange={(e) => updateStatusRule(index, 'Late_Come', e.target.value)}
          className={`${inputClass} w-20`}
          
          min="0"
        />
      </td>
      
      {/* Allow_Days */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={rule.Allow_Days || ''}
          onChange={(e) => updateStatusRule(index, 'Allow_Days', e.target.value)}
          className={`${inputClass} w-20`}
          
          min="0"
        />
      </td>
      
      {/* HALF - NEW COLUMN */}
      <td className="px-4 py-2">
        <input
          type="text"
          value={rule.HALF || ''}
          onChange={(e) => updateStatusRule(index, 'HALF', e.target.value.toUpperCase())}
          className={`${inputClass} w-20`}
         
          maxLength={5}
        />
      </td>
      
      {/* HALF_VAL - NEW COLUMN */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={rule.HALF_VAL || ''}
          onChange={(e) => updateStatusRule(index, 'HALF_VAL', e.target.value)}
          className={`${inputClass} w-20`}
          
          min="0"
        />
      </td>
      
      {/* Priority_Code */}
      <td className="px-4 py-2">
        <input
          type="number"
          value={rule.Priority_Code || ''}
          onChange={(e) => updateStatusRule(index, 'Priority_Code', e.target.value)}
          className={`${inputClass} w-16`}
          
          min="0"
        />
      </td>
      
      {/* Region */}
      <td className="px-4 py-2">
        <select
          value={rule.Region || ''}
          onChange={(e) => updateStatusRule(index, 'Region', e.target.value)}
          className={`${inputClass} w-24`}
        >
          <option value="">Select</option>
          {regions.map((region) => (
            <option key={region.Misc_Code} value={region.Misc_Code}>
              {region.MISC_NAME}
            </option>
          ))}
        </select>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-2">
        {(rule.Desc !== 'P' && rule.Desc !== 'HLF') && (
          <button
            onClick={() => removeStatusRule(index)}
            className="p-1.5 hover:bg-exit/10 rounded-lg text-exit transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {(rule.Desc === 'P' || rule.Desc === 'HLF') && (
          <span className="text-xs text-gray-400">Required</span>
        )}
      </td>
    </tr>
  ))}
</tbody>
              </table>
            </div>
          </div>
        );


    case "hardcodedpolicies":
  return (
    <div className="space-y-6 animate-fadeIn">
      

      
        <div className="overflow-x-auto border border-borderColor dark:border-borderColor-dark rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-off dark:bg-dark/50 border-b border-borderColor dark:border-borderColor-dark">
                <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">UTD</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Policy Name</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-header dark:text-white uppercase">Description</th>
                
                <th className="px-4 py-3 text-center text-sm font-bold text-header dark:text-white uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderColor dark:divide-borderColor-dark">
              {hardcodedPolicies.map((policy) => (
                <tr 
                  key={policy.UTD} 
                  className={`hover:bg-off/50 dark:hover:bg-dark/30 transition-colors ${
                    policy.IS_ENABLED ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">
                    {policy.UTD}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-header dark:text-white">
                      {policy.POLICY_NAME}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-body-color">
                      {policy.POLICY_DESC}
                    </span>
                  </td>
                 
                  <td className="px-4 py-3 text-center">
                    {renderToggle(
                      policy.IS_ENABLED,
                      () => {
                        setHardcodedPolicies(prev =>
                          prev.map(p =>
                            p.UTD === policy.UTD 
                              ? { ...p, IS_ENABLED: !p.IS_ENABLED } 
                              : p
                          )
                        );
                      }
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      

 
    </div>
  );
      case "shift":
        return (
          <div className="space-y-6 animate-fadeIn">
       

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
              <div>
                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase">Shift Type</label>
                <select value={formData.shiftType} onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })} className={inputClass}>
                  <option value="">Select Shift Type</option>
                  <option value="fixed">Fixed Shift</option>
                  <option value="flexible">Flexible Shift</option>
                  <option value="rotational">Rotational Shift</option>
                </select>
              </div>
            <Ainput title="Working Hours" type="text" name="workingHours" value={formData.workingHours} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} className="mt-2" />

            
            </div>


            <div>
              <label className="block text-sm font-bold text-header dark:text-white mb-3 uppercase tracking-wider">Weekly Working Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <label key={day} className={`flex items-center gap-3 p-3 bg-off dark:bg-dark border-2 rounded-lg cursor-pointer hover:border-primary transition-all ${formData.weeklyWorkingDays.includes(day) ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                    <input type="checkbox" checked={formData.weeklyWorkingDays.includes(day)} onChange={() => {
                      if (formData.weeklyWorkingDays.includes(day)) setFormData({ ...formData, weeklyWorkingDays: formData.weeklyWorkingDays.filter(d => d !== day) });
                      else setFormData({ ...formData, weeklyWorkingDays: [...formData.weeklyWorkingDays, day] });
                    }} className="w-4 h-4 accent-primary cursor-pointer" />
                    <span className="text-sm font-semibold text-black dark:text-white capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "overtime":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-borderColor rounded">
              <div><p className="text-base font-bold text-header dark:text-white">Enable Overtime Rules</p><p className="text-sm text-body-color">Apply overtime rules and compensation</p></div>
              {renderToggle(formData.overtimeAllowed, () => setFormData({ ...formData, overtimeAllowed: !formData.overtimeAllowed }))}
            </div>

            {formData.overtimeAllowed && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                  <Ainput title="Max Overtime Per Day (Hours)" type="number" name="maxOvertimePerDay" value={formData.maxOvertimePerDay} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 4" />
                  <Ainput title="Max Overtime Per Month (Hours)" type="number" name="maxOvertimePerMonth" value={formData.maxOvertimePerMonth} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 40" />
                </div>

                <div className="border-t border-borderColor dark:border-borderColor-dark pt-6 mt-4">
                  <h3 className="text-lg font-bold text-header dark:text-white mb-4 uppercase tracking-wider">Compensatory Off Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                      <div>
                        <p className="text-sm font-bold text-header dark:text-white">Comp Off Allowed</p>
                        <p className="text-xs text-body-color">Allow comp off for overtime</p>
                      </div>
                      {renderToggle(formData.overtimeCompensatoryOff, () => setFormData({ ...formData, overtimeCompensatoryOff: !formData.overtimeCompensatoryOff }))}
                    </div>
                    <Ainput title="Comp Off Validity (Days)" type="number" name="compOffValidityDays" value={formData.compOffValidityDays} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 60" />
                    <Ainput title="Max Comp Off Balance" type="number" name="maxCompOffBalance" value={formData.maxCompOffBalance} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 10" />
                    <Ainput title="Min Hours for Comp Off" type="number" name="minimumHoursForCompOff" value={formData.minimumHoursForCompOff} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 4" />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "misspunch":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-borderColor rounded">
              <div><p className="text-base font-bold text-header dark:text-white">Enable Missing Punch Rules</p><p className="text-sm text-body-color">Allow missing punch corrections</p></div>
              {renderToggle(formData.missingPunchAllowed, () => setFormData({ ...formData, missingPunchAllowed: !formData.missingPunchAllowed }))}
            </div>

            <div className="border-t border-borderColor dark:border-borderColor-dark pt-6 mt-4">
              <h3 className="text-lg font-bold text-header dark:text-white mb-4 uppercase tracking-wider">Regularization Rules</h3>
              <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-borderColor rounded">
                <div><p className="text-base font-bold text-header dark:text-white">Enable Regularization</p><p className="text-sm text-body-color">Allow employees to regularize attendance</p></div>
                {renderToggle(formData.regularizationAllowed, () => setFormData({ ...formData, regularizationAllowed: !formData.regularizationAllowed }))}
              </div>

              {formData.regularizationAllowed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Ainput title="Regularization Period (Days)" type="number" name="regularizationPeriod" value={formData.regularizationPeriod} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })}  />
                  <Ainput title="Max Days to Regularize" type="number" name="regularizationMaxDays" value={formData.regularizationMaxDays} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} />
                 
                </div>
              )}
            </div>
          </div>
        );

      case "weeklyoff":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-bold text-header dark:text-white mb-3 uppercase tracking-wider">Weekly Off Pattern</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-3 bg-off dark:bg-dark border-2 rounded-lg cursor-pointer hover:border-primary transition-all ${formData.weeklyOffPattern === 'fixed' ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                  <input type="radio" name="weeklyOffPattern" value="fixed" checked={formData.weeklyOffPattern === "fixed"} onChange={(e) => setFormData({ ...formData, weeklyOffPattern: e.target.value })} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-semibold text-header dark:text-white">Fixed Weekly Off</span>
                </label>
                <label className={`flex items-center gap-3 p-3 bg-off dark:bg-dark border-2 rounded-lg cursor-pointer hover:border-primary transition-all ${formData.weeklyOffPattern === 'rotational' ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                  <input type="radio" name="weeklyOffPattern" value="rotational" checked={formData.weeklyOffPattern === "rotational"} onChange={(e) => setFormData({ ...formData, weeklyOffPattern: e.target.value })} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-semibold text-header dark:text-white">Rotational Weekly Off</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-header dark:text-white mb-3 uppercase tracking-wider">Weekly Off Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                  <label key={day} className={`flex items-center gap-3 p-3 bg-off dark:bg-dark border-2 rounded-lg cursor-pointer hover:border-primary transition-all ${formData.weeklyOffDays.includes(day) ? 'border-primary bg-primary/5' : 'border-borderColor dark:border-borderColor-dark'}`}>
                    <input type="checkbox" checked={formData.weeklyOffDays.includes(day)} onChange={() => {
                      if (formData.weeklyOffDays.includes(day)) setFormData({ ...formData, weeklyOffDays: formData.weeklyOffDays.filter(d => d !== day) });
                      else setFormData({ ...formData, weeklyOffDays: [...formData.weeklyOffDays, day] });
                    }} className="w-4 h-4 accent-primary cursor-pointer" />
                    <span className="text-sm font-semibold text-header dark:text-white capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                <div>
                  <p className="text-sm font-bold text-header dark:text-white">Alternative Off</p>
                  <p className="text-xs text-body-color">Allow alternative weekly off days</p>
                </div>
                {renderToggle(formData.weeklyOffAlternative, () => setFormData({ ...formData, weeklyOffAlternative: !formData.weeklyOffAlternative }))}
              </div>
              <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                <div>
                  <p className="text-sm font-bold text-header dark:text-white">Comp Off</p>
                  <p className="text-xs text-body-color">Allow comp off for working on weekly off</p>
                </div>
                {renderToggle(formData.weeklyOffCompensatory, () => setFormData({ ...formData, weeklyOffCompensatory: !formData.weeklyOffCompensatory }))}
              </div>
            </div>

            <div className="border-t border-borderColor dark:border-borderColor-dark pt-6 mt-4">
              <h3 className="text-lg font-bold text-header dark:text-white mb-4 uppercase tracking-wider">Sandwich Policy</h3>
              <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                <div>
                  <p className="text-sm font-bold text-header dark:text-white">Enable Sandwich Policy</p>
                  <p className="text-xs text-body-color">Apply sandwich policy for absences around off days</p>
                </div>
                {renderToggle(formData.enableSandwichPolicy, () => setFormData({ ...formData, enableSandwichPolicy: !formData.enableSandwichPolicy }))}
              </div>
            </div>
          </div>
        );

      case "geofencing":
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between p-5 bg-off dark:bg-dark border-2 border-borderColor rounded">
              <div><p className="text-base font-bold text-header dark:text-white">Enable Geofencing</p><p className="text-sm text-body-color">Enable GPS location based attendance</p></div>
              {renderToggle(formData.enableGeoFence, () => setFormData({ ...formData, enableGeoFence: !formData.enableGeoFence }))}
            </div>

            {formData.enableGeoFence && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Ainput title="Allowed Radius (Meters)" type="number" name="allowedRadius" value={formData.allowedRadius} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 100" />
                <Ainput title="Latitude" type="text" name="latitude" value={formData.latitude} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 28.6139" />
                <Ainput title="Longitude" type="text" name="longitude" value={formData.longitude} handleInputChange={(name, value) => setFormData({ ...formData, [name]: value })} placeholder="e.g., 77.2090" />
              </div>
            )}

            <div className="border-t border-borderColor dark:border-borderColor-dark pt-6 mt-4">
              <h3 className="text-lg font-bold text-header dark:text-white mb-4 uppercase tracking-wider">Device Restrictions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                  <div>
                    <p className="text-sm font-bold text-header dark:text-white">Mobile Punch</p>
                    <p className="text-xs text-body-color">Allow punch from mobile app</p>
                  </div>
                  {renderToggle(formData.allowMobilePunch, () => setFormData({ ...formData, allowMobilePunch: !formData.allowMobilePunch }))}
                </div>
                <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                  <div>
                    <p className="text-sm font-bold text-header dark:text-white">Web Punch</p>
                    <p className="text-xs text-body-color">Allow punch from web browser</p>
                  </div>
                  {renderToggle(formData.allowWebPunch, () => setFormData({ ...formData, allowWebPunch: !formData.allowWebPunch }))}
                </div>
                <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                  <div>
                    <p className="text-sm font-bold text-header dark:text-white">Biometric Punch</p>
                    <p className="text-xs text-body-color">Allow punch from biometric device</p>
                  </div>
                  {renderToggle(formData.allowBiometricPunch, () => setFormData({ ...formData, allowBiometricPunch: !formData.allowBiometricPunch }))}
                </div>
                <div className="flex items-center justify-between p-4 bg-off dark:bg-dark border-2 border-borderColor dark:border-borderColor-dark rounded">
                  <div>
                    <p className="text-sm font-bold text-header dark:text-white">Face Recognition</p>
                    <p className="text-xs text-body-color">Allow face recognition punch</p>
                  </div>
                  {renderToggle(formData.allowFaceRecognition, () => setFormData({ ...formData, allowFaceRecognition: !formData.allowFaceRecognition }))}
                </div>
              </div>
            </div>

            <div className="border-t border-borderColor dark:border-borderColor-dark pt-6 mt-4">
              <h3 className="text-lg font-bold text-header dark:text-white mb-4 uppercase tracking-wider">Attendance Source Priority</h3>
              <div>
                <label className="block text-sm font-bold text-header dark:text-white mb-2 uppercase">Source Priority</label>
                <select value={formData.attendanceSourcePriority} onChange={(e) => setFormData({ ...formData, attendanceSourcePriority: e.target.value })} className={inputClass}>
                  <option value="">Select Priority</option>
                  <option value="biometric">Biometric &gt; Mobile &gt; Web</option>
                  <option value="mobile">Mobile &gt; Biometric &gt; Web</option>
                  <option value="web">Web &gt; Mobile &gt; Biometric</option>
                  <option value="face">Face Recognition &gt; Biometric &gt; Mobile</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // List View
  if (view === "list") {
    const filteredPolicies = policyTableData.filter(policy =>
      policy.policyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.shiftType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="w-full min-h-screen bg-white dark:bg-black">
        <div className="w-full bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 border-b border-borderColor dark:border-borderColor-dark px-6 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded"><Clock8 className="w-8 h-6 text-primary" /></div>
              <div>
                <h1 className="text-3xl md:text-3xl font-bold text-white uppercase tracking-wider">Attendance Management</h1>
                <p className="text-white/70 text-sm mt-1 font-medium">Create and manage attendance policies for your organization</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => { setView("form"); setExpandedTab("basic"); }} variant="update" className="text-white flex items-center gap-2 font-bold uppercase text-lg py-3 px-6">
                + CREATE POLICY
              </Button>
              <Button variant="print" onClick={() => window.history.back()} className="flex items-center gap-2 font-bold text-base">BACK</Button>
            </div>
          </div>
        </div>

        <div className="w-full px-6 md:px-8 py-8">
          <div className="bg-white dark:bg-dark rounded border border-borderColor dark:border-borderColor-dark shadow-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-borderColor dark:border-borderColor-dark">
              <h3 className="text-lg font-bold text-header dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />Attendance Policies
              </h3>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search policies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-borderColor dark:border-borderColor-dark rounded-lg bg-gray-50 dark:bg-dark/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm w-full sm:w-64 transition-all" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-off dark:bg-input text-header dark:text-white dark:bg-dark/50 border-b border-borderColor dark:border-borderColor-dark">
                      <th className="px-6 py-4 text-left text-base font-bold text-header dark:text-white uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-header dark:text-white uppercase tracking-wider">Shift Type</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-header dark:text-white uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-header dark:text-white uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-header dark:text-white uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-base font-bold text-header dark:text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderColor dark:divide-borderColor-dark">
                    {filteredPolicies.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center">No policies found. Click "CREATE POLICY" to add one.</td></tr>
                    ) : (
                      filteredPolicies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-off dark:hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4"><span className="font-bold text-left text-base text-black dark:text-white">{policy.policyName}</span></td>
                          <td className="px-6 py-4"><span className="inline-flex items-center px-3 py-1.5 rounded-full text-base font-bold bg-primary/10 text-primary">{policy.shiftType}</span></td>
                          <td className="px-6 py-4 text-base font-semibold text-black dark:text-white">{formatDate(policy.startDate)}</td>
                          <td className="px-6 py-4 text-base font-semibold text-black dark:text-white">{formatDate(policy.endDate)}</td>
                          <td className="px-6 py-4">{getStatusBadge(policy.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => fetchPolicyById(policy.id)} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"><Edit className="w-6 h-6" /></button>
                              <button onClick={() => deletePolicy(policy.id, policy.policyName)} className="p-2 hover:bg-exit/10 rounded-lg text-exit transition-colors"><Trash2 className="w-6 h-6" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-between items-center p-4 border-t border-borderColor dark:border-borderColor-dark text-xs text-gray-400">
              <span>Showing {filteredPolicies.length} of {policyTableData.length} policies</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="w-full min-h-screen bg-white dark:bg-black">
      <div className="w-full bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 border-b border-borderColor dark:border-borderColor-dark px-6 md:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded"><Clock8 className="w-8 h-6 text-primary" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">{editingPolicy ? "Edit Attendance Policy" : "Create Attendance Policy"}</h1>
              <p className="text-white/70 text-sm mt-1 font-medium">Configure all attendance policy settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* {editingPolicy && (
              <Button variant="outline" onClick={fetchPolicyLogs} className="flex items-center gap-2 border-2 border-yellow text-yellow hover:bg-yellow/10">
                History
              </Button>
            )} */}
            <Button variant="outline" onClick={() => setShowPreviewModal(true)}><Eye className="w-4 h-4" /></Button>
            <Button variant="update" onClick={saveAttendancePolicy} disabled={loading}>
              {loading ? 'Saving...' : (editingPolicy ? 'Update Policy' : 'Save Policy')}
            </Button>
            <Button onClick={() => { setView("list"); setEditingPolicy(null); resetForm(); }} variant="print">CLOSE</Button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-8 py-8">
        <div className="max-w-full">
          <div className="space-y-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isExpanded = expandedTab === tab.id;
              const getBorderColor = () => 'dark:border-borderColor-dark bg-white dark:bg-black border border-borderColor dark:border-borderColor-dark shadow';
              const getShadowColor = () => {
                const shadowMap: Record<string, string> = {
                  'text-primary': 'shadow-primary/20', 'text-[#67E8F9]': 'shadow-[#67E8F9]/20',
                  'text-yellow': 'shadow-yellow/20', 'text-green': 'shadow-green/20',
                  'text-[#F472B6]': 'shadow-[#F472B6]/20', 'text-[#34D399]': 'shadow-[#34D399]/20',
                  'text-[#D8B4FE]': 'shadow-[#D8B4FE]/20',
                };
                return isExpanded ? shadowMap[tab.color] || 'shadow-primary/20' : '';
              };
              const getHoverBorderColor = () => {
                const hoverMap: Record<string, string> = {
                  'text-primary': 'hover:border-primary/60', 'text-[#67E8F9]': 'hover:border-[#67E8F9]/60',
                  'text-yellow': 'hover:border-yellow/60', 'text-green': 'hover:border-green/60',
                  'text-[#F472B6]': 'hover:border-[#F472B6]/60', 'text-[#34D399]': 'hover:border-[#34D399]/60',
                  'text-[#D8B4FE]': 'hover:border-[#D8B4FE]/60',
                };
                return hoverMap[tab.color] || 'hover:border-borderColor';
              };

              return (
                <div key={tab.id} className={`border-2 rounded transition-all duration-300 overflow-hidden ${isExpanded ? `${getBorderColor()} shadow-lg ${getShadowColor()}` : `${getBorderColor()} ${getHoverBorderColor()} dark:border-borderColor-dark`}`}>
                  <button onClick={() => toggleTab(tab.id)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-off/50 dark:hover:bg-dark/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isExpanded ? 'bg-opacity-20' : 'bg-off dark:bg-dark/50'}`} style={isExpanded ? { backgroundColor: tab.color.replace('text-', '') + '20' } : {}}>
                        <Icon className={`w-6 h-6 ${isExpanded ? tab.color : tab.color}`} />
                      </div>
                      <div className="text-left">
                        <span className={`text-xl font-bold text-header`}>{tab.label}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{tab.proTip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className={`w-5 h-5 text-header`} /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-borderColor dark:border-borderColor-dark">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">{renderTabContent()}</div>
                        <div className="lg:col-span-1">
                          <div className={`bg-gradient-to-br from-[#f8f9fc] to-white dark:from-dark/40 dark:to-dark/20 rounded border border-borderColor dark:border-borderColor-dark shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sticky top-4 h-fit`}>
                            <div className="flex items-start gap-2 mb-4">
                              <div className="relative flex-shrink-0"><div className={`relative p-1.5`}><Lightbulb className="w-6 h-6 text-yellow" strokeWidth={2.5} /></div></div>
                              <div><h3 className="text-xl font-bold text-header tracking-tight">Pro Tips</h3><p className="text-[10px] text-body-color dark:text-gray-400 font-medium tracking-wider uppercase">Best Practices</p></div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className={`flex-1 h-px bg-gradient-to-r ${tab.color.replace('text-', 'from-')}/30 to-transparent`}></div>
                                <p className={`text-[14px] font-semibold text-header uppercase tracking-wider whitespace-nowrap`}>{proTips[tab.id]?.title || "Tips"}</p>
                                <div className={`flex-1 h-px bg-gradient-to-l ${tab.color.replace('text-', 'from-')}/30 to-transparent`}></div>
                              </div>
                              <ul className="space-y-2">
                                {proTips[tab.id]?.tips.map((tip, index) => (
                                  <li key={index} className={`group relative flex items-start gap-2 p-2.5 rounded-lg bg-white/60 dark:bg-dark/30 border border-borderColor/30 dark:border-borderColor-dark/30 hover:${tab.color.replace('text-', 'border-')}/50 dark:hover:${tab.color.replace('text-', 'border-')}/20 transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}>
                                    
                                    <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed flex-1">{tip}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${tab.color.replace('text-', 'from-')}/5 to-yellow/5 rounded-full blur-2xl pointer-events-none`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview Modal */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-primary/20">
                <div className="bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 px-6 py-4 flex justify-between items-center border-b border-borderColor dark:border-borderColor-dark">
                  <div><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Policy Preview</h2><p className="text-white/70 text-sm">Review all configuration details</p></div>
                  <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {Object.entries(getPreviewData()).map(([section, data]) => (
                    <div key={section} className="mb-6 last:mb-0">
                      <h3 className="text-lg font-bold text-header dark:text-white mb-3 uppercase tracking-wider border-b border-borderColor dark:border-borderColor-dark pb-2">{section}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(data).map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center p-2 bg-off/50 dark:bg-dark/30 rounded-lg border border-borderColor/30 dark:border-borderColor-dark/30">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}:</span>
                            <span className="text-sm font-medium text-black dark:text-white text-right">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Log Modal */}
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-dark rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-primary/20 flex flex-col">
                <div className="bg-gradient-to-r from-header to-header/80 dark:from-dark dark:to-dark/60 px-6 py-5 flex justify-between items-center border-b border-borderColor dark:border-borderColor-dark">
                  <div><h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><FileText className="w-6 h-6" />Policy Change History</h2></div>
                  <button onClick={() => setShowLogModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="overflow-auto flex-1 p-6">
                  {policyLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12"><FileText className="w-12 h-12 text-gray-300 mb-4" /><p className="text-gray-500 dark:text-gray-400 text-lg">No history available</p></div>
                  ) : (
                    <div className="space-y-4">
                      {policyLogs.map((log, index) => (
                        <div key={index} className="border-2 border-borderColor dark:border-borderColor-dark rounded-xl p-5 hover:border-primary/50 transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3"><div className="p-3 bg-primary/10 rounded-lg"><CheckCircle className="w-6 h-6 text-primary" /></div><div><p className="font-bold text-black dark:text-white text-lg">Change #{policyLogs.length - index}</p></div></div>
                          </div>
                          {Object.entries(log.changes || {}).length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead><tr className="border-b-2 text-base border-borderColor dark:border-borderColor-dark">
                                  <th className="text-left text-base px-3 py-2 font-bold text-header dark:text-white">Field</th>
                                  <th className="text-left text-base px-3 py-2 font-bold text-header dark:text-white">Previous Value</th>
                                  <th className="text-left px-3 text-base py-2 font-bold text-header dark:text-white">New Value</th>
                                </tr></thead>
                                <tbody>
                                  {Object.entries(log.changes).map(([field, values]: any, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-borderColor/30 dark:border-borderColor-dark/30 hover:bg-primary/5 transition-colors">
                                      <td className="px-3 py-3"><span className="font-semibold text-black text-lg dark:text-white bg-gray-100 dark:bg-dark/50 px-2 py-1 rounded inline-block">{field}</span></td>
                                      <td className="px-3 py-3"><span className="text-exit font-bold text-lg bg-exit/10 px-2 py-1 rounded block max-w-xs truncate">{String(values.old)}</span></td>
                                      <td className="px-3 py-3"><span className="text-green font-bold text-lg bg-green/10 px-2 py-1 rounded block max-w-xs truncate">{String(values.new)}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : <p className="text-gray-500 dark:text-gray-400 text-sm italic">No changes recorded</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-borderColor dark:border-borderColor-dark bg-off dark:bg-dark/30 flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total revisions: <span className="font-bold text-primary">{policyLogs.length}</span></p>
                  <Button variant="outline" onClick={() => setShowLogModal(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}