import { useCallback, useEffect, useState } from "react";

import { DEF_SETTINGS, Entry, LogRow, Master, PModel, Settings } from "./Invoice";
import { Api, toast } from "./utils";

export function useBillingData(api: Api, enabled: boolean) {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState<Master[]>([]);
  const [models, setModels] = useState<PModel[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [settings, setSettings] = useState<Settings>(DEF_SETTINGS);

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api("getBillingEntries");
      setRows(r?.Result || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadMasters = useCallback(async () => {
    try {
      const r = await api("getBillingMasters");
      setMasters((r?.Result || []).map((m: any) => ({ ...m, Is_Live: !!m.Is_Live })));
    } catch (e) { setMasters([]); }
  }, [api]);

  const loadModels = useCallback(async () => {
    try {
      const r = await api("getBillingPricingModels");
      setModels(r?.Result || []);
    } catch (e) { setModels([]); }
  }, [api]);

  const loadLogs = useCallback(async () => {
    try {
      const r = await api("getBillingLogs");
      setLogs(r?.Result || []);
    } catch (e) { setLogs([]); }
  }, [api]);

  const loadSettings = useCallback(async () => {
    try {
      const r = await api("getBillingSettings");
      const d = r?.Result;
      if (d) setSettings({ co: { ...DEF_SETTINGS.co, ...(d.co || {}) }, mine: d.mine || null, auto: { ...DEF_SETTINGS.auto, ...(d.auto || {}) } });
    } catch (e) { /* defaults */ }
  }, [api]);

  const saveSettings = async (next: Settings, silent = false) => {
    setSettings(next);
    try {
      const r = await api("saveBillingSettings", { Settings: next });
      if (!silent) toast(r?.Status ? "Settings saved" : r?.Message || "Save failed", r?.Status ? "success" : "error");
    } catch (e: any) {
      toast(e?.response?.data?.Message || "Save failed", "error");
    }
  };

  const reloadAll = useCallback(() => Promise.all([loadRows(), loadLogs(), loadSettings()]), [loadRows, loadLogs, loadSettings]);

  useEffect(() => {
    if (!enabled) return;
    loadRows(); loadMasters(); loadModels(); loadLogs(); loadSettings();
  }, [enabled, loadRows, loadMasters, loadModels, loadLogs, loadSettings]);

  return { rows, loading, masters, models, logs, settings, loadRows, loadMasters, loadModels, loadLogs, loadSettings, saveSettings, reloadAll };
}