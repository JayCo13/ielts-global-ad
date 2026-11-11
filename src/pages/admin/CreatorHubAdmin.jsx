import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../config/api';

// Creator Hub admin tabs (2026-11), rendered inside pages/admin/CreatorProgram.jsx.
// Backend: app/routes/admin/creator_hub_admin.py (/admin/creator-hub/...).

const getToken = () => localStorage.getItem('access_token');
const authed = async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
    });
    const t = await res.text();
    const data = t ? JSON.parse(t) : null;
    if (!res.ok) throw new Error((data && data.detail && (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))) || 'Lỗi');
    return data;
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 ${className}`}>{children}</div>
);
const Err = ({ err }) => (err ? <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div> : null);
const num = (n) => Number(n || 0).toLocaleString('vi-VN');
const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '');
const day = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const money = (units, meta) => {
    const div = meta?.unit_divisor || 1;
    const v = Number(units || 0) / div;
    const s = v.toLocaleString('en-US', div === 1 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return meta?.currency === 'USD' ? `$${s}` : `${s} ${meta?.currency || ''}`;
};

const APP_ST = {
    not_applied: ['Chưa đăng ký', 'text-gray-500 bg-gray-100'], pending: ['Chờ duyệt', 'text-amber-700 bg-amber-100'],
    approved: ['Đã duyệt', 'text-green-700 bg-green-100'], rejected: ['Từ chối', 'text-red-600 bg-red-100'],
};
const CH_ST = {
    pending: ['Chờ duyệt', 'text-amber-700 bg-amber-100'], approved: ['Đã duyệt', 'text-green-700 bg-green-100'],
    rejected: ['Từ chối', 'text-red-600 bg-red-100'], suspended: ['Đình chỉ', 'text-gray-700 bg-gray-200'],
};
const REC_ST = {
    submitted: ['Đã gửi', 'text-sky-700 bg-sky-100'], under_review: ['Đang kiểm tra', 'text-amber-700 bg-amber-100'],
    approved: ['Đã duyệt', 'text-green-700 bg-green-100'], rejected: ['Từ chối', 'text-red-600 bg-red-100'],
};
const SOURCE = { application: 'Duyệt đơn', admin_direct: 'Admin cấp trực tiếp', grandfathered: 'Affiliate cũ (tự cấp khi ra mắt)' };
const Pill = ({ map, v }) => {
    const [l, c] = map[v] || [v, 'text-gray-600 bg-gray-100'];
    return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${c}`}>{l}</span>;
};
const askReason = (label) => {
    const r = window.prompt(label);
    if (r == null) return null;
    if (!r.trim()) { window.alert('Bắt buộc ghi lý do.'); return null; }
    return r.trim();
};

// ── Creator profile detail (shared by Access / Overview / Earnings) ─────────
function CreatorDetail({ userId, onClose }) {
    const [d, setD] = useState(null);
    const [err, setErr] = useState('');
    useEffect(() => { authed(`/admin/creator-hub/creators/${userId}`).then(setD).catch(e => setErr(e.message)); }, [userId]);
    return (
        <Card className="mt-4 border-indigo-200">
            <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-gray-800 dark:text-gray-100">Hồ sơ creator #{userId}</div>
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Đóng ✕</button>
            </div>
            <Err err={err} />
            {!d ? <div className="text-sm text-gray-400">Đang tải…</div> : (
                <div className="space-y-4 text-sm">
                    <div className="grid sm:grid-cols-4 gap-3">
                        <div><div className="text-xs text-gray-400">Tài khoản</div><b>{d.user.username}</b><div className="text-xs text-gray-500">{d.user.email}</div></div>
                        <div><div className="text-xs text-gray-400">Họ tên / SĐT</div>{d.profile?.full_name || '—'}<div className="text-xs text-gray-500">{d.profile?.phone || '—'} {d.profile?.email && `· ${d.profile.email}`}</div></div>
                        <div><div className="text-xs text-gray-400">Creator Hub</div>{d.profile?.hub_access ? <span className="text-green-600 font-semibold">Đang mở</span> : <span className="text-gray-500">Đang tắt</span>}<div className="text-xs text-gray-500">{SOURCE[d.profile?.access_source] || ''} {d.profile?.enabled_at && `· ${day(d.profile.enabled_at)}`}</div></div>
                        <div><div className="text-xs text-gray-400">Số dư ví</div><b>{money(d.user.wallet_balance, d)}</b></div>
                    </div>
                    <div>
                        <div className="font-semibold mb-1">Kênh ({d.channels.length})</div>
                        {d.channels.map(c => (
                            <div key={c.id} className="flex flex-wrap gap-2 items-center py-1 border-b border-gray-50">
                                <Pill map={CH_ST} v={c.status} /> <b>{c.platform_label}</b>
                                <a href={c.channel_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{c.channel_name} ↗</a>
                                <span className="text-xs text-gray-500">views đã duyệt: {num(c.approved_total_views)}</span>
                                {c.status_reason && <span className="text-xs text-red-500">Lý do: {c.status_reason}</span>}
                            </div>
                        ))}
                        {!d.channels.length && <div className="text-gray-400">Chưa có kênh.</div>}
                    </div>
                    <div>
                        <div className="font-semibold mb-1">Lịch sử đối soát</div>
                        {d.reconciliations.map(r => (
                            <div key={r.id} className="py-1 border-b border-gray-50">
                                <Pill map={REC_ST} v={r.status} /> #{r.id} · {dt(r.submitted_at)} · tạm tính {usd(r.estimated_usd)}
                                {r.approved_units != null && ` · đã cộng ${money(r.approved_units, d)}`}
                                {r.reject_reason && <span className="text-xs text-red-500"> · Lý do: {r.reject_reason}</span>}
                            </div>
                        ))}
                        {!d.reconciliations.length && <div className="text-gray-400">Chưa có.</div>}
                    </div>
                    <div>
                        <div className="font-semibold mb-1">Lịch sử ví (Creator + Affiliate)</div>
                        <div className="max-h-56 overflow-y-auto">
                            {d.wallet.map(t => (
                                <div key={t.id} className="flex justify-between gap-2 py-0.5 text-xs border-b border-gray-50">
                                    <span className="text-gray-500 whitespace-nowrap">{dt(t.created_at)}</span>
                                    <span className="flex-1">{t.type === 'creator_reward' ? '🎬 ' : t.type === 'commission' ? '🎁 ' : '💸 '}{t.description}</span>
                                    <span className={`tabular-nums ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>{money(t.amount, d)}</span>
                                </div>
                            ))}
                            {!d.wallet.length && <div className="text-gray-400 text-xs">Chưa có giao dịch.</div>}
                        </div>
                    </div>
                    <div>
                        <div className="font-semibold mb-1">Đơn đăng ký</div>
                        {d.applications.map(a => (
                            <div key={a.id} className="text-xs py-0.5"><Pill map={APP_ST} v={a.status} /> #{a.id} · {dt(a.created_at)} · {a.full_name} · {a.phone} {a.reject_reason && <span className="text-red-500">· Lý do: {a.reject_reason}</span>}</div>
                        ))}
                        {!d.applications.length && <div className="text-gray-400 text-xs">Không có (được cấp trực tiếp).</div>}
                    </div>
                </div>
            )}
        </Card>
    );
}

// ── Creator Hub Access ───────────────────────────────────────────────────────
export function HubAccess() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [q, setQ] = useState('');
    const [only, setOnly] = useState('');
    const [err, setErr] = useState('');
    const [logs, setLogs] = useState({});
    const [detail, setDetail] = useState(null);

    const load = useCallback(async () => {
        setErr('');
        try {
            const p = new URLSearchParams({ page_size: 100 });
            if (q.trim()) p.set('q', q.trim());
            if (only) p.set('only', only);
            setData(await authed(`/admin/creator-hub/access?${p}`));
        } catch (e) { setErr(e.message); }
    }, [q, only]);
    useEffect(() => { load(); }, [only]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = async (u) => {
        const enable = !u.hub_access;
        const note = window.prompt(enable
            ? `Cấp quyền Creator Hub cho ${u.username}? (mở cả Creator Program + Affiliate). Ghi chú (không bắt buộc):`
            : `Thu hồi quyền Creator Hub của ${u.username}? Dữ liệu, ví và lịch sử vẫn giữ nguyên. Ghi chú (không bắt buộc):`, '');
        if (note == null) return;
        try { await authed(`/admin/creator-hub/access/${u.user_id}`, { method: 'POST', body: JSON.stringify({ enabled: enable, note }) }); await load(); }
        catch (e) { setErr(e.message); }
    };
    const showLogs = async (u) => {
        if (logs[u.user_id]) { setLogs(l => ({ ...l, [u.user_id]: null })); return; }
        try { const r = await authed(`/admin/creator-hub/access/${u.user_id}/logs`); setLogs(l => ({ ...l, [u.user_id]: r })); }
        catch (e) { setErr(e.message); }
    };

    return (
        <>
            <Card>
                <div className="text-xs text-gray-500 mb-3">
                    Mặc định mọi tài khoản đều <b>tắt</b> Creator Hub. Duyệt đơn sẽ tự mở; admin cũng có thể cấp trực tiếp cho bất kỳ tài khoản nào.
                    Tắt quyền chỉ ẩn Creator Hub — không xoá kênh, đối soát, ví hay lịch sử giao dịch.
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                    {[['', 'Có hồ sơ / đơn'], ['enabled', 'Đang mở Hub']].map(([k, l]) => (
                        <button key={k || 'all'} onClick={() => setOnly(k)} className={`btn-sm ${only === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                    ))}
                    <div className="flex gap-2 ml-auto">
                        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Tìm mọi tài khoản: username / email / SĐT…" className="form-input py-1 w-72" />
                        <button onClick={load} className="btn-sm bg-indigo-600 text-white">Tìm</button>
                    </div>
                </div>
                <Err err={err} />
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                            <tr><th className="px-3 py-2 text-left">Tài khoản</th><th className="px-3 py-2 text-left">SĐT</th><th className="px-3 py-2 text-left">Đơn creator</th>
                                <th className="px-3 py-2 text-left">Creator Hub</th><th className="px-3 py-2 text-left">Hồ sơ</th><th className="px-3 py-2 text-left">Ngày mở</th><th /></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.items.map(u => (
                                <React.Fragment key={u.user_id}>
                                    <tr className="align-top">
                                        <td className="px-3 py-2"><b>{u.username}</b><div className="text-xs text-gray-500">{u.email}</div>{u.full_name && <div className="text-xs text-gray-500">{u.full_name}</div>}</td>
                                        <td className="px-3 py-2 text-xs">{u.phone || '—'}</td>
                                        <td className="px-3 py-2"><Pill map={APP_ST} v={u.application_status} /></td>
                                        <td className="px-3 py-2">
                                            {u.hub_access ? <span className="text-green-600 font-semibold text-xs">Enabled</span> : <span className="text-gray-400 text-xs">Disabled</span>}
                                            {u.access_source && <div className="text-[11px] text-gray-400">{SOURCE[u.access_source] || u.access_source}</div>}
                                        </td>
                                        <td className="px-3 py-2 text-xs">{u.hub_access || u.registration_complete ? (u.registration_complete ? 'Completed' : 'Incomplete') : '—'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-500">{day(u.enabled_at)}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <button onClick={() => toggle(u)} className={`btn-xs ${u.hub_access ? 'border-gray-200 text-red-500' : 'bg-green-600 hover:bg-green-700 text-white'}`}>{u.hub_access ? 'Thu hồi' : 'Cấp quyền'}</button>
                                            <button onClick={() => showLogs(u)} className="btn-xs border-gray-200 text-gray-600 ml-1">Lịch sử</button>
                                            <button onClick={() => setDetail(u.user_id)} className="btn-xs border-gray-200 text-indigo-600 ml-1">Hồ sơ</button>
                                        </td>
                                    </tr>
                                    {logs[u.user_id] && (
                                        <tr><td colSpan={7} className="px-3 pb-3 text-xs text-gray-600">
                                            {logs[u.user_id].length ? logs[u.user_id].map((l, i) => (
                                                <div key={i}>{dt(l.created_at)} · <b>{l.action === 'enable' ? 'Mở' : 'Tắt'}</b> · {SOURCE[l.source] || l.source}{l.actor && ` · bởi ${l.actor}`}{l.note && ` · ${l.note}`}</div>
                                            )) : 'Chưa có lịch sử.'}
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {!data.items.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Không có tài khoản nào.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
            {detail && <CreatorDetail userId={detail} onClose={() => setDetail(null)} />}
        </>
    );
}

// ── Creator overview ─────────────────────────────────────────────────────────
export function HubCreators() {
    const [data, setData] = useState({ items: [] });
    const [q, setQ] = useState('');
    const [err, setErr] = useState('');
    const [detail, setDetail] = useState(null);
    const load = useCallback(async () => {
        setErr('');
        try { setData(await authed(`/admin/creator-hub/creators${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)); }
        catch (e) { setErr(e.message); }
    }, [q]);
    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <>
            <Card>
                <div className="flex gap-2 mb-3 justify-end">
                    <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Tìm creator…" className="form-input py-1" />
                    <button onClick={load} className="btn-sm bg-indigo-600 text-white">Tìm</button>
                </div>
                <Err err={err} />
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                            <tr><th className="px-2 py-2 text-left">#</th><th className="px-2 py-2 text-left">Creator</th><th className="px-2 py-2 text-left">Liên hệ</th>
                                <th className="px-2 py-2 text-left">Đơn / Hub</th><th className="px-2 py-2 text-right">Kênh (duyệt/chờ/tổng)</th>
                                <th className="px-2 py-2 text-right">Views khai báo</th><th className="px-2 py-2 text-right">Views đã duyệt</th>
                                <th className="px-2 py-2 text-right">Thưởng creator</th><th className="px-2 py-2 text-right">Hoa hồng affiliate</th><th className="px-2 py-2 text-right">Số dư ví</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.items.map((c, i) => (
                                <tr key={c.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(c.user_id)}>
                                    <td className="px-2 py-2 text-gray-400">{i + 1}</td>
                                    <td className="px-2 py-2"><b>{c.username}</b><div className="text-xs text-gray-500">{c.full_name}</div><div className="text-[11px] text-gray-400">từ {day(c.enabled_at)}</div></td>
                                    <td className="px-2 py-2 text-xs">{c.email}<div>{c.phone}{c.phone && <a onClick={e => e.stopPropagation()} href={`https://wa.me/${String(c.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ml-1 text-green-600">WhatsApp</a>}</div></td>
                                    <td className="px-2 py-2"><Pill map={APP_ST} v={c.application_status} /><div className={`text-xs mt-0.5 ${c.hub_access ? 'text-green-600' : 'text-gray-400'}`}>{c.hub_access ? 'Hub mở' : 'Hub tắt'}</div></td>
                                    <td className="px-2 py-2 text-right tabular-nums">{c.channels_approved}/{c.channels_pending}/{c.channels_total}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{num(c.declared_views)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{num(c.approved_views)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums text-violet-600">{money(c.creator_rewards, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums text-emerald-600">{money(c.affiliate_commission, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums font-semibold">{money(c.wallet_balance, data)}</td>
                                </tr>
                            ))}
                            {!data.items.length && <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">Chưa có creator.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
            {detail && <CreatorDetail userId={detail} onClose={() => setDetail(null)} />}
        </>
    );
}

// ── Channels ─────────────────────────────────────────────────────────────────
const PLATFORM_OPTS = [['', 'Mọi nền tảng'], ['youtube', 'YouTube'], ['tiktok', 'TikTok'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['x', 'X'], ['threads', 'Threads']];

export function HubChannels() {
    const [data, setData] = useState({ items: [], counts: {} });
    const [status, setStatus] = useState('pending');
    const [platform, setPlatform] = useState('');
    const [q, setQ] = useState('');
    const [err, setErr] = useState('');
    const [logs, setLogs] = useState({});

    const load = useCallback(async () => {
        setErr('');
        try {
            const p = new URLSearchParams({ page_size: 200 });
            if (status) p.set('status', status);
            if (platform) p.set('platform', platform);
            if (q.trim()) p.set('q', q.trim());
            setData(await authed(`/admin/creator-hub/channels?${p}`));
        } catch (e) { setErr(e.message); }
    }, [status, platform, q]);
    useEffect(() => { load(); }, [status, platform]); // eslint-disable-line react-hooks/exhaustive-deps

    const act = async (c, action) => {
        let reason = null;
        if (action === 'reject') { reason = askReason(`Lý do từ chối kênh "${c.channel_name}":`); if (!reason) return; }
        if (action === 'suspend') { reason = askReason(`Lý do đình chỉ kênh "${c.channel_name}" (kênh sẽ không nhập views / tính thưởng mới):`); if (!reason) return; }
        if (action === 'approve' && c.duplicates > 0 && !window.confirm(`Kênh này trùng link với ${c.duplicates} creator khác. Vẫn duyệt?`)) return;
        if (action === 'reactivate' && !window.confirm(`Kích hoạt lại "${c.channel_name}"? Không cộng thưởng cho thời gian bị đình chỉ.`)) return;
        try { await authed(`/admin/creator-hub/channels/${c.id}/status`, { method: 'POST', body: JSON.stringify({ action, reason }) }); setLogs(l => ({ ...l, [c.id]: null })); await load(); }
        catch (e) { setErr(e.message); }
    };
    const showLogs = async (c) => {
        if (logs[c.id]) { setLogs(l => ({ ...l, [c.id]: null })); return; }
        try { const r = await authed(`/admin/creator-hub/channels/${c.id}/logs`); setLogs(l => ({ ...l, [c.id]: r })); } catch (e) { setErr(e.message); }
    };

    return (
        <Card>
            <div className="flex flex-wrap gap-2 mb-3">
                {[['', 'Tất cả'], ...Object.entries(CH_ST).map(([k, v]) => [k, v[0]])].map(([k, l]) => (
                    <button key={k || 'all'} onClick={() => setStatus(k)} className={`btn-sm ${status === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>
                        {l}{k && data.counts?.[k] != null ? ` (${data.counts[k]})` : ''}
                    </button>
                ))}
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="form-select py-1 text-sm">
                    {PLATFORM_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <div className="flex gap-2 ml-auto">
                    <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Creator / tên kênh / link…" className="form-input py-1" />
                    <button onClick={load} className="btn-sm bg-indigo-600 text-white">Tìm</button>
                </div>
            </div>
            <Err err={err} />
            <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr><th className="px-3 py-2 text-left">Creator</th><th className="px-3 py-2 text-left">Kênh</th><th className="px-3 py-2 text-left">Ngày đăng ký</th>
                            <th className="px-3 py-2 text-left">Trạng thái</th><th className="px-3 py-2 text-right">Views đã duyệt</th><th /></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.items.map(c => (
                            <React.Fragment key={c.id}>
                                <tr className="align-top">
                                    <td className="px-3 py-2"><b>{c.username}</b><div className="text-xs text-gray-500">{c.full_name}</div></td>
                                    <td className="px-3 py-2">
                                        <div className="text-xs text-gray-500">{c.platform_label}{c.is_primary && ' · ★ kênh chính'}</div>
                                        <a href={c.channel_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">{c.channel_name} ↗</a>
                                        <div className="text-[11px] text-gray-400 break-all">{c.channel_url}</div>
                                        {c.duplicates > 0 && <div className="text-[11px] font-semibold text-red-600">⚠ Trùng link với {c.duplicates} creator khác</div>}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{dt(c.registered_at)}</td>
                                    <td className="px-3 py-2"><Pill map={CH_ST} v={c.status} />{c.status_reason && <div className="text-[11px] text-red-500 mt-1">Lý do: {c.status_reason}</div>}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{num(c.approved_total_views)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {(c.status === 'pending' || c.status === 'rejected') && <button onClick={() => act(c, 'approve')} className="btn-xs bg-green-600 hover:bg-green-700 text-white mr-1">Duyệt</button>}
                                        {c.status === 'pending' && <button onClick={() => act(c, 'reject')} className="btn-xs border-gray-200 text-red-500 mr-1">Từ chối</button>}
                                        {c.status === 'approved' && <button onClick={() => act(c, 'suspend')} className="btn-xs border-gray-200 text-red-500 mr-1">Đình chỉ</button>}
                                        {c.status === 'suspended' && <button onClick={() => act(c, 'reactivate')} className="btn-xs bg-green-600 hover:bg-green-700 text-white mr-1">Kích hoạt lại</button>}
                                        <button onClick={() => showLogs(c)} className="btn-xs border-gray-200 text-gray-600">Lịch sử</button>
                                    </td>
                                </tr>
                                {logs[c.id] && (
                                    <tr><td colSpan={6} className="px-3 pb-3 text-xs text-gray-600">
                                        {logs[c.id].length ? logs[c.id].map((l, i) => (
                                            <div key={i}>{dt(l.created_at)} · {CH_ST[l.from_status]?.[0] || l.from_status || '—'} → <b>{CH_ST[l.to_status]?.[0] || l.to_status}</b>{l.actor && ` · ${l.actor}`}{l.reason && ` · ${l.reason}`}</div>
                                        )) : 'Chưa có thay đổi trạng thái.'}
                                    </td></tr>
                                )}
                            </React.Fragment>
                        ))}
                        {!data.items.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Không có kênh.</td></tr>}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// ── Reconciliations ──────────────────────────────────────────────────────────
export function HubReconciliations() {
    const [data, setData] = useState({ items: [], counts: {} });
    const [status, setStatus] = useState('open');
    const [q, setQ] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(null);

    const load = useCallback(async () => {
        setErr('');
        try {
            const p = new URLSearchParams({ page_size: 100 });
            if (status) p.set('status', status);
            if (q.trim()) p.set('q', q.trim());
            setData(await authed(`/admin/creator-hub/reconciliations?${p}`));
        } catch (e) { setErr(e.message); }
    }, [status, q]);
    useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    const act = async (r, action) => {
        let body = {};
        if (action === 'reject') { const reason = askReason(`Lý do từ chối đối soát #${r.id} của ${r.username}:`); if (!reason) return; body = { reason }; }
        if (action === 'approve' && !window.confirm(`Duyệt đối soát #${r.id} và cộng ${usd(r.estimated_usd)} vào ví của ${r.username}? (chỉ cộng 1 lần)`)) return;
        setBusy(r.id);
        try { await authed(`/admin/creator-hub/reconciliations/${r.id}/${action}`, { method: 'POST', body: JSON.stringify(body) }); await load(); }
        catch (e) { setErr(e.message); } finally { setBusy(null); }
    };
    const openCount = (data.counts?.submitted || 0) + (data.counts?.under_review || 0);

    return (
        <div className="space-y-3">
            <Card>
                <div className="flex flex-wrap gap-2">
                    {[['open', `Cần xử lý (${openCount})`], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối'], ['', 'Tất cả']].map(([k, l]) => (
                        <button key={k || 'all'} onClick={() => setStatus(k)} className={`btn-sm ${status === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                    ))}
                    <div className="flex gap-2 ml-auto">
                        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Tìm creator…" className="form-input py-1" />
                        <button onClick={load} className="btn-sm bg-indigo-600 text-white">Tìm</button>
                    </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">Mở link kênh để đối chiếu tổng views creator khai báo. Duyệt thì cộng tiền vào ví (Creator Reward) và cập nhật mốc views cho kỳ sau; từ chối phải ghi lý do, creator sửa và gửi lại.</div>
            </Card>
            <Err err={err} />
            {data.items.map(r => (
                <Card key={r.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="text-sm"><b>#{r.id}</b> · <b>{r.username}</b> · gửi {dt(r.submitted_at)} <Pill map={REC_ST} v={r.status} />
                            {r.reviewed_at && <span className="text-xs text-gray-500"> · xử lý {dt(r.reviewed_at)}</span>}</div>
                        <div className="text-sm">Tạm tính: <b className="text-emerald-600">{usd(r.estimated_usd)}</b>
                            {r.approved_units != null && <span className="text-xs text-gray-500"> · đã cộng ví {money(r.approved_units, data)} (GD #{r.wallet_tx_id || '—'})</span>}</div>
                    </div>
                    <SubmitGap r={r} />
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full text-sm">
                            <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                                <tr><th className="px-2 py-1 text-left">Kênh</th><th className="px-2 py-1 text-left">Loại</th><th className="px-2 py-1 text-right">Tổng đã duyệt kỳ trước</th>
                                    <th className="px-2 py-1 text-right">Tổng khai báo</th><th className="px-2 py-1 text-left">Tính đến</th><th className="px-2 py-1 text-right">Views kỳ này</th>
                                    <th className="px-2 py-1 text-right">Mức thưởng</th><th className="px-2 py-1 text-right">Tạm tính</th><th className="px-2 py-1 text-left">Bằng chứng</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {r.items.map(it => (
                                    <tr key={it.channel_id}>
                                        <td className="px-2 py-1"><span className="text-xs text-gray-500">{it.platform}</span> <a href={it.channel_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{it.channel_name} ↗</a>
                                            {it.channel_status !== 'approved' && <span className="ml-1"><Pill map={CH_ST} v={it.channel_status} /></span>}</td>
                                        <td className="px-2 py-1">{it.channel_type === 'primary' ? <b className="text-orange-600">Kênh chính</b> : 'Kênh phụ'}</td>
                                        <td className="px-2 py-1 text-right tabular-nums">{num(it.previous_total)}</td>
                                        <td className="px-2 py-1 text-right tabular-nums">{num(it.submitted_total)}</td>
                                        <td className="px-2 py-1 text-xs">{day(it.views_date)}</td>
                                        <td className="px-2 py-1 text-right tabular-nums font-semibold">{num(it.period_views)}</td>
                                        <td className="px-2 py-1 text-right text-xs">${it.rate_per_k}/1K</td>
                                        <td className="px-2 py-1 text-right tabular-nums">{usd(it.estimated_usd)}</td>
                                        <td className="px-2 py-1 text-xs whitespace-nowrap">
                                            {(it.proof_urls || []).length
                                                ? it.proof_urls.map((u, i) => <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-2 text-indigo-600 hover:underline">{/\.(mp4|mov|webm)$/i.test(u) ? '🎬' : '🖼️'} {i + 1}</a>)
                                                : <span className="text-gray-400">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {r.reject_reason && <div className="text-xs text-red-500 mt-2">Lý do từ chối: {r.reject_reason}</div>}
                    {['submitted', 'under_review'].includes(r.status) && (
                        <div className="flex gap-2 mt-3">
                            {r.status === 'submitted' && <button disabled={busy === r.id} onClick={() => act(r, 'review')} className="btn-sm border-gray-200 text-amber-700">Đánh dấu đang kiểm tra</button>}
                            <button disabled={busy === r.id} onClick={() => act(r, 'approve')} className="btn-sm bg-green-600 hover:bg-green-700 text-white">Duyệt &amp; cộng ví</button>
                            <button disabled={busy === r.id} onClick={() => act(r, 'reject')} className="btn-sm border-gray-200 text-red-500">Từ chối</button>
                        </div>
                    )}
                </Card>
            ))}
            {!data.items.length && <Card><div className="text-center text-gray-400 text-sm py-4">Không có yêu cầu đối soát.</div></Card>}
        </div>
    );
}

// Feedback 2026-11-10: previous submission / this submission / days between (anti-spam check).
const MIN_GAP_DAYS = 20;
function SubmitGap({ r }) {
    const gap = r.days_since_previous;
    const short = gap != null && gap < MIN_GAP_DAYS;
    return (
        <div className={`mb-2 flex flex-wrap gap-x-5 gap-y-1 rounded-lg px-3 py-2 text-xs ${short ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
            <span>Lần gửi gần nhất trước đó: <b>{r.previous_submitted_at ? dt(r.previous_submitted_at) : 'chưa có (lần đầu)'}</b></span>
            <span>Lần gửi này: <b>{dt(r.submitted_at)}</b></span>
            <span>Cách nhau: <b>{gap == null ? '—' : `${Math.floor(gap)} ngày`}</b>{short && ` (dưới ${MIN_GAP_DAYS} ngày)`}</span>
        </div>
    );
}

// ── Leaderboard (feedback 2026-11-10) ───────────────────────────────────────
// Default order = official rank (VIP/views → sign-ups/views → views). Clicking a header:
// 1st DESC (name A→Z), 2nd ASC (name Z→A), 3rd back to the official order. Sorting never changes rank.
const LB_COLS = [
    ['name', 'Tên creator', 'left'], ['total_views', 'Tổng views'], ['views_reward', 'Thưởng views'],
    ['affiliate_commission', 'Hoa hồng affiliate'], ['total_reward', 'Tổng tiền thưởng'],
    ['signup_rate', 'Tỷ lệ ĐK TK / views'], ['vip_rate', 'Tỷ lệ ĐK VIP / views'],
];
const pct = (v) => `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 4 })}%`;
const monthLabel = (m) => { const [y, mo] = (m || '').split('-'); return y ? `Tháng ${Number(mo)}/${y}` : ''; };

export function HubLeaderboard() {
    const [period, setPeriod] = useState('lifetime');
    const [month, setMonth] = useState('');
    const [sorts, setSorts] = useState({ lifetime: null, monthly: null });
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        setErr('');
        const p = new URLSearchParams({ period });
        if (period === 'monthly' && month) p.set('month', month);
        authed(`/admin/creator-hub/leaderboard?${p}`)
            .then((d) => { setData(d); if (period === 'monthly' && !month && d.month) setMonth(d.month); })
            .catch((e) => setErr(e.message));
    }, [period, month]);

    const sort = sorts[period];
    const clickHead = (key) => setSorts((s) => {
        const cur = s[period];
        let next;
        if (!cur || cur.key !== key) next = { key, dir: 1 };
        else if (cur.dir === 1) next = { key, dir: 2 };
        else next = null;
        return { ...s, [period]: next };
    });
    const rows = [...(data?.items || [])];
    if (sort) {
        rows.sort((a, b) => {
            if (sort.key === 'name') {
                const c = a.name.localeCompare(b.name, 'vi');
                return sort.dir === 1 ? c : -c;
            }
            const c = (b[sort.key] || 0) - (a[sort.key] || 0);
            return (sort.dir === 1 ? c : -c) || a.rank - b.rank;
        });
    }
    const arrow = (key) => (sort?.key !== key ? '↕' : key === 'name' ? (sort.dir === 1 ? 'A→Z' : 'Z→A') : (sort.dir === 1 ? '↓' : '↑'));

    return (
        <div className="space-y-3">
            <Card>
                <div className="flex flex-wrap items-center gap-2">
                    {[['lifetime', 'Tổng hợp (Lifetime)'], ['monthly', 'Theo tháng (Monthly)']].map(([k, l]) => (
                        <button key={k} onClick={() => setPeriod(k)} className={`btn-sm ${period === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>{l}</button>
                    ))}
                    {period === 'monthly' && (
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="form-select py-1 ml-2">
                            {(data?.months || []).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                        </select>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-2">Tổng tiền thưởng = Thưởng views + Hoa hồng affiliate. Thứ hạng chính thức: tỷ lệ ĐK VIP/views → tỷ lệ ĐK tài khoản/views → tổng views. Bấm tiêu đề cột để sắp xếp (lần 1 giảm dần, lần 2 tăng dần, lần 3 về thứ hạng mặc định) — sắp xếp không đổi thứ hạng.</div>
            </Card>
            <Err err={err} />
            <Card>
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="px-2 py-2 text-left">STT</th>
                                <th className="px-2 py-2 text-left">Hạng</th>
                                {LB_COLS.map(([k, l, align]) => (
                                    <th key={k} className={`px-2 py-2 ${align === 'left' ? 'text-left' : 'text-right'}`}>
                                        <button onClick={() => clickHead(k)} className={`uppercase hover:text-indigo-600 ${sort?.key === k ? 'text-indigo-600' : ''}`}>{l} <span className="normal-case">{arrow(k)}</span></button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((r, i) => (
                                <tr key={r.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(r.user_id)}>
                                    <td className="px-2 py-2 tabular-nums">{i + 1}</td>
                                    <td className="px-2 py-2 tabular-nums text-gray-500">#{r.rank}</td>
                                    <td className="px-2 py-2"><div className="font-medium">{r.name}</div><div className="text-[11px] text-gray-400">{r.username}{r.email ? ` · ${r.email}` : ''}</div></td>
                                    <td className="px-2 py-2 text-right tabular-nums">{num(r.total_views)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{money(r.views_reward, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{money(r.affiliate_commission, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums font-semibold text-emerald-600">{money(r.total_reward, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{pct(r.signup_rate)} <span className="text-[11px] text-gray-400">({num(r.signups)})</span></td>
                                    <td className="px-2 py-2 text-right tabular-nums">{pct(r.vip_rate)} <span className="text-[11px] text-gray-400">({num(r.vip_buyers)})</span></td>
                                </tr>
                            ))}
                            {data && !rows.length && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">{period === 'monthly' ? 'Chưa có số liệu trong tháng này.' : 'Chưa có creator.'}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
            {detail && <CreatorDetail userId={detail} onClose={() => setDetail(null)} />}
        </div>
    );
}

// ── Earnings ─────────────────────────────────────────────────────────────────
export function HubEarnings() {
    const [data, setData] = useState({ items: [] });
    const [tx, setTx] = useState(null);
    const [err, setErr] = useState('');
    const [detail, setDetail] = useState(null);
    useEffect(() => {
        authed('/admin/creator-hub/earnings').then(setData).catch(e => setErr(e.message));
        authed('/admin/creator-hub/earnings/transactions').then(setTx).catch(e => setErr(e.message));
    }, []);
    const totals = data.items.reduce((s, x) => ({ approved: s.approved + x.approved_rewards, pending: s.pending + x.pending_rewards_usd, views: s.views + x.approved_views }), { approved: 0, pending: 0, views: 0 });
    return (
        <div className="space-y-4">
            <Err err={err} />
            <div className="grid sm:grid-cols-3 gap-3">
                <Card><div className="text-xs text-gray-500">Tổng thưởng creator đã duyệt</div><div className="text-xl font-bold text-violet-600">{money(totals.approved, data)}</div></Card>
                <Card><div className="text-xs text-gray-500">Đang chờ duyệt (tạm tính)</div><div className="text-xl font-bold text-amber-600">{usd(totals.pending)}</div></Card>
                <Card><div className="text-xs text-gray-500">Tổng views đã duyệt</div><div className="text-xl font-bold">{num(totals.views)}</div></Card>
            </div>
            <Card>
                <div className="font-semibold mb-2">Theo creator</div>
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm">
                        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                            <tr><th className="px-2 py-2 text-left">Creator</th><th className="px-2 py-2 text-right">Thưởng đã duyệt</th><th className="px-2 py-2 text-right">Chờ duyệt</th>
                                <th className="px-2 py-2 text-right">Views đã duyệt</th><th className="px-2 py-2 text-right">Số dư ví</th><th className="px-2 py-2 text-right">Đã rút (đã trả)</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.items.map(x => (
                                <tr key={x.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetail(x.user_id)}>
                                    <td className="px-2 py-2 font-medium">{x.username}</td>
                                    <td className="px-2 py-2 text-right tabular-nums text-violet-600">{money(x.approved_rewards, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{usd(x.pending_rewards_usd)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{num(x.approved_views)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums font-semibold">{money(x.wallet_balance, data)}</td>
                                    <td className="px-2 py-2 text-right tabular-nums">{money(x.withdrawn_paid, data)}</td>
                                </tr>
                            ))}
                            {!data.items.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Chưa có thu nhập.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div className="text-xs text-gray-500 mt-2">Rút tiền dùng chung luồng Affiliate (Admin → Affiliate → Yêu cầu rút tiền).</div>
            </Card>
            {detail && <CreatorDetail userId={detail} onClose={() => setDetail(null)} />}
            <Card>
                <div className="font-semibold mb-2">Giao dịch Creator Reward</div>
                <div className="overflow-x-auto">
                    <table className="table-auto w-full text-xs">
                        <thead className="uppercase text-gray-400 border-b border-gray-100">
                            <tr><th className="px-2 py-1 text-left">Ngày duyệt</th><th className="px-2 py-1 text-left">Creator</th><th className="px-2 py-1 text-left">Kỳ đối soát</th>
                                <th className="px-2 py-1 text-left">Kênh · loại · views · mức</th><th className="px-2 py-1 text-right">Đã cộng</th><th className="px-2 py-1 text-right">Mã GD</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(tx?.items || []).map(r => (
                                <tr key={r.id} className="align-top">
                                    <td className="px-2 py-1 whitespace-nowrap">{dt(r.reviewed_at)}</td>
                                    <td className="px-2 py-1">{r.username}</td>
                                    <td className="px-2 py-1">#{r.id} · gửi {day(r.submitted_at)}</td>
                                    <td className="px-2 py-1">{r.items.map(it => <div key={it.channel_id}>{it.channel_name} · {it.channel_type === 'primary' ? 'chính' : 'phụ'} · {num(it.period_views)} views · ${it.rate_per_k}/1K = {usd(it.estimated_usd)}</div>)}</td>
                                    <td className="px-2 py-1 text-right tabular-nums">{money(r.approved_units, tx)}</td>
                                    <td className="px-2 py-1 text-right">{r.wallet_tx_id || '—'}</td>
                                </tr>
                            ))}
                            {!(tx?.items || []).length && <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400">Chưa có.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
