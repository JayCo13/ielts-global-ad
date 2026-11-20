import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { API_BASE } from '../../config/api';
import { countryName, ALL_COUNTRY_CODES } from '../../data/countries';
import { HubAccess, HubCreators, HubChannels, HubReconciliations, HubEarnings, HubLeaderboard, HubBonusSettings } from './CreatorHubAdmin';

// "Work With Us" (UGC creator program) admin: applications from /work-with-us,
// video cards, creator cards, and which countries the sign-up form offers.

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

const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${API_BASE}/admin/action/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.image_url) throw new Error((data && data.detail) || 'Tải ảnh thất bại');
    return /^https?:\/\//.test(data.image_url) ? data.image_url : `${API_BASE}${data.image_url}`;
};

const STATUS = {
    new: { label: 'Chờ duyệt · mới', cls: 'text-blue-700 bg-blue-100' },
    contacted: { label: 'Chờ duyệt · đã liên hệ', cls: 'text-amber-700 bg-amber-100' },
    approved: { label: 'Đã duyệt', cls: 'text-green-700 bg-green-100' },
    rejected: { label: 'Từ chối', cls: 'text-gray-600 bg-gray-100' },
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-4 ${className}`}>{children}</div>
);
const Msg = ({ msg, err }) => (
    <>
        {msg && <div className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{msg}</div>}
        {err && <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}
    </>
);

// ── Applications ────────────────────────────────────────────────────────────
function Applications() {
    const [data, setData] = useState({ items: [], total: 0, counts: {} });
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [err, setErr] = useState('');
    const [notes, setNotes] = useState({});
    const pageSize = 50;

    const load = useCallback(async () => {
        setErr('');
        try {
            const p = new URLSearchParams({ page, page_size: pageSize });
            if (status) p.set('status', status);
            if (q.trim()) p.set('q', q.trim());
            setData(await authed(`/admin/creator-program/applications?${p}`));
        } catch (e) { setErr(e.message); }
    }, [page, status, q]);
    useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

    const update = async (a, patch) => {
        try { await authed(`/admin/creator-program/applications/${a.id}`, { method: 'PUT', body: JSON.stringify(patch) }); await load(); }
        catch (e) { setErr(e.message); }
    };
    // Creator Hub: approve opens Hub access for the linked account; reject needs a reason.
    const approve = async (a) => {
        setErr('');
        let body = {};
        if (!a.account) {
            const who = window.prompt('Đơn này chưa gắn tài khoản. Nhập username hoặc email tài khoản của người này để gắn và duyệt:');
            if (!who) return;
            try {
                const r = await authed(`/admin/creator-hub/access?q=${encodeURIComponent(who.trim())}&page_size=10`);
                const exact = r.items.find(u => [u.username, u.email].map(x => (x || '').toLowerCase()).includes(who.trim().toLowerCase()));
                if (!exact) { setErr(`Không tìm thấy tài khoản "${who}".`); return; }
                body = { user_id: exact.user_id };
            } catch (e) { setErr(e.message); return; }
        } else if (!window.confirm(`Duyệt đơn của ${a.full_name} và mở Creator Hub cho tài khoản ${a.account.username}?`)) return;
        try { await authed(`/admin/creator-hub/applications/${a.id}/approve`, { method: 'POST', body: JSON.stringify(body) }); await load(); }
        catch (e) { setErr(e.message); }
    };
    const reject = async (a) => {
        const reason = window.prompt(`Lý do từ chối đơn của ${a.full_name} (creator sẽ thấy lý do này):`);
        if (reason == null) return;
        if (!reason.trim()) { setErr('Bắt buộc ghi lý do từ chối.'); return; }
        try { await authed(`/admin/creator-hub/applications/${a.id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }); await load(); }
        catch (e) { setErr(e.message); }
    };
    const remove = async (a) => {
        if (!window.confirm(`Xoá đơn của ${a.full_name}?`)) return;
        try { await authed(`/admin/creator-program/applications/${a.id}`, { method: 'DELETE' }); await load(); }
        catch (e) { setErr(e.message); }
    };
    const exportCsv = () => {
        const rows = [['Ngày', 'Tên', 'Quốc gia', 'Ngôn ngữ', 'Điện thoại', 'Email', 'Trạng thái', 'Ghi chú']]
            .concat(data.items.map(a => [a.created_at, a.full_name, a.country_code === 'OTHER' ? `Other${a.country_other ? ': ' + a.country_other : ''}` : countryName(a.country_code),
                a.languages, a.phone, a.email, STATUS[a.status]?.label || a.status, a.admin_note]));
        const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        link.download = 'creator-applications.csv';
        link.click();
    };

    const pages = Math.max(1, Math.ceil((data.total || 0) / pageSize));
    return (
        <Card>
            <div className="flex flex-wrap gap-2 mb-3">
                {[['', 'Tất cả'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
                    <button key={k || 'all'} onClick={() => { setStatus(k); setPage(1); }}
                        className={`btn-sm ${status === k ? 'bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'}`}>
                        {label}{k && data.counts?.[k] != null ? ` (${data.counts[k]})` : ''}
                    </button>
                ))}
                <div className="flex gap-2 ml-auto">
                    <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), load())}
                        placeholder="Tìm tên / email / SĐT…" className="form-input py-1" />
                    <button onClick={() => { setPage(1); load(); }} className="btn-sm bg-indigo-600 text-white">Tìm</button>
                    <button onClick={exportCsv} className="btn-sm border-gray-200 text-gray-600">Xuất CSV</button>
                </div>
            </div>
            <Msg err={err} />
            <div className="overflow-x-auto">
                <table className="table-auto w-full text-sm">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-left">Ngày</th><th className="px-3 py-2 text-left">Người đăng ký</th>
                            <th className="px-3 py-2 text-left">Quốc gia / Ngôn ngữ</th><th className="px-3 py-2 text-left">Liên hệ</th>
                            <th className="px-3 py-2 text-left">Trạng thái</th><th className="px-3 py-2 text-left">Ghi chú</th><th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.items.map(a => (
                            <tr key={a.id} className="align-top">
                                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{a.created_at ? new Date(a.created_at).toLocaleString('vi-VN') : ''}</td>
                                <td className="px-3 py-2"><div className="font-medium text-gray-800 dark:text-gray-100">{a.full_name}</div>
                                    {a.account
                                        ? <div className="text-[11px] text-gray-500">TK: <b>{a.account.username}</b>{!a.account.linked && ' (khớp email)'}{a.account.hub_access && <span className="ml-1 text-green-600">· Hub đang mở</span>}</div>
                                        : <div className="text-[11px] text-amber-600">Chưa gắn tài khoản</div>}
                                    <div className="text-[11px] text-gray-400">{a.source === 'hub' ? 'Gửi từ Creator Hub' : 'Gửi từ trang Work With Us'}</div></td>
                                <td className="px-3 py-2"><div>{!a.country_code ? '—' : a.country_code === 'OTHER' ? (a.country_other ? `Khác: ${a.country_other}` : 'Other country') : `${countryName(a.country_code)} (${a.country_code})`}</div>
                                    <div className="text-xs text-gray-500">{a.languages}</div></td>
                                <td className="px-3 py-2"><a href={`tel:${a.phone}`} className="text-indigo-600">{a.phone}</a>
                                    {a.phone && <a href={`https://wa.me/${String(a.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="ml-2 text-xs text-green-600">WhatsApp</a>}
                                    {a.email && <div className="text-xs"><a href={`mailto:${a.email}`} className="text-gray-600">{a.email}</a></div>}</td>
                                <td className="px-3 py-2 min-w-[170px]">
                                    {['new', 'contacted'].includes(a.status) ? (
                                        <>
                                            <select value={a.status} onChange={e => update(a, { status: e.target.value })}
                                                className={`form-select py-1 text-xs font-semibold ${STATUS[a.status]?.cls || ''}`}>
                                                <option value="new">{STATUS.new.label}</option>
                                                <option value="contacted">{STATUS.contacted.label}</option>
                                            </select>
                                            <div className="flex gap-1 mt-1">
                                                <button onClick={() => approve(a)} className="btn-xs bg-green-600 hover:bg-green-700 text-white">Duyệt</button>
                                                <button onClick={() => reject(a)} className="btn-xs border-gray-200 text-red-500">Từ chối</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[a.status]?.cls || ''}`}>{STATUS[a.status]?.label || a.status}</span>
                                            {a.status === 'rejected' && a.reject_reason && <div className="text-[11px] text-red-500 mt-1">Lý do: {a.reject_reason}</div>}
                                            {a.status === 'rejected' && <button onClick={() => approve(a)} className="block mt-1 text-[11px] text-green-700 hover:underline">Duyệt lại</button>}
                                        </>
                                    )}
                                </td>
                                <td className="px-3 py-2 min-w-[200px]">
                                    <textarea rows={2} className="form-textarea w-full text-xs" defaultValue={a.admin_note || ''}
                                        onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                                        onBlur={() => notes[a.id] !== undefined && notes[a.id] !== (a.admin_note || '') && update(a, { admin_note: notes[a.id] })} />
                                </td>
                                <td className="px-3 py-2"><button onClick={() => remove(a)} className="text-xs text-red-500 hover:underline">Xoá</button></td>
                            </tr>
                        ))}
                        {!data.items.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Chưa có đơn đăng ký.</td></tr>}
                    </tbody>
                </table>
            </div>
            {pages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-3 text-sm">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-sm border-gray-200 disabled:opacity-40">‹</button>
                    <span>{page}/{pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-sm border-gray-200 disabled:opacity-40">›</button>
                </div>
            )}
        </Card>
    );
}

// ── Generic editable list (videos / creators) ───────────────────────────────
function ImageField({ value, onChange, label }) {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <div className="flex items-center gap-2">
                {value && <img src={value} alt="" className="w-12 h-12 rounded object-cover border" />}
                <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="https://…" className="form-input w-full py-1 text-xs" />
                <label className={`btn-sm border-gray-200 text-gray-600 cursor-pointer whitespace-nowrap ${busy ? 'opacity-50' : ''}`}>
                    {busy ? 'Đang tải…' : 'Tải ảnh'}
                    <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async e => {
                        const f = e.target.files?.[0]; e.target.value = '';
                        if (!f) return;
                        setBusy(true); setErr('');
                        try { onChange(await uploadImage(f)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
                    }} />
                </label>
            </div>
            {err && <div className="text-xs text-red-500 mt-1">{err}</div>}
        </div>
    );
}

const EMPTY_VIDEO = { video_url: '', thumbnail_url: '', handle: '', likes: '', views: '', earned: '', display_order: 0, is_active: true };
const EMPTY_CREATOR = { name: '', avatar_url: '', subtitle: '', earned: '', note: '', profile_url: '', display_order: 0, is_active: true };

function Videos() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(null);   // null = closed; {id?} editing
    const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
    const [fetching, setFetching] = useState(false);
    const load = useCallback(async () => { try { setItems(await authed('/admin/creator-program/videos')); } catch (e) { setErr(e.message); } }, []);
    useEffect(() => { load(); }, [load]);
    const set = (p) => setForm(f => ({ ...f, ...p }));

    const fetchMeta = async () => {
        if (!form.video_url.trim()) return;
        setFetching(true); setErr(''); setMsg('');
        try {
            const m = await authed('/admin/creator-program/videos/fetch-meta', { method: 'POST', body: JSON.stringify({ video_url: form.video_url }) });
            setForm(f => ({ ...f, thumbnail_url: m.thumbnail_url || f.thumbnail_url, handle: f.handle || m.handle || '' }));
            if (m.message) setErr(m.message); else setMsg('Đã lấy ảnh bìa' + (m.handle ? ` và tài khoản ${m.handle}` : '') + '.');
        } catch (e) { setErr(e.message); } finally { setFetching(false); }
    };
    const save = async () => {
        setErr(''); setMsg('');
        try {
            const body = JSON.stringify({ ...form, display_order: Number(form.display_order) || 0 });
            if (form.id) await authed(`/admin/creator-program/videos/${form.id}`, { method: 'PUT', body });
            else await authed('/admin/creator-program/videos', { method: 'POST', body });
            setForm(null); setMsg('Đã lưu.'); await load();
        } catch (e) { setErr(e.message); }
    };
    const remove = async (v) => {
        if (!window.confirm('Xoá video này?')) return;
        try { await authed(`/admin/creator-program/videos/${v.id}`, { method: 'DELETE' }); await load(); } catch (e) { setErr(e.message); }
    };

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Thẻ video chạy ngang ở đầu trang Work With Us. Bấm vào thẻ sẽ mở video gốc.</div>
                <button onClick={() => { setForm({ ...EMPTY_VIDEO }); setErr(''); setMsg(''); }} className="btn-sm bg-indigo-600 text-white">+ Thêm video</button>
            </div>
            <Msg msg={msg} err={err} />
            {form && (
                <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Link video (TikTok / YouTube Shorts / Instagram / Facebook)</label>
                        <div className="flex gap-2">
                            <input value={form.video_url} onChange={e => set({ video_url: e.target.value })} className="form-input w-full py-1" placeholder="https://www.tiktok.com/@…/video/…" />
                            <button onClick={fetchMeta} disabled={fetching} className="btn-sm border-gray-200 text-gray-600 whitespace-nowrap">{fetching ? 'Đang lấy…' : 'Lấy ảnh tự động'}</button>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">TikTok / YouTube: tự lấy ảnh bìa + tên tài khoản. Instagram / Facebook: tải ảnh bìa lên tay. Số tim / view / tiền nhập tay.</div>
                    </div>
                    <div className="sm:col-span-2"><ImageField label="Ảnh bìa" value={form.thumbnail_url} onChange={v => set({ thumbnail_url: v })} /></div>
                    {[['handle', 'Tài khoản (@…)'], ['likes', 'Số tim (vd 10K)'], ['views', 'Lượt xem (vd 2M)'], ['earned', 'Tiền nhận (vd $144)'], ['display_order', 'Thứ tự']].map(([k, l]) => (
                        <div key={k}><label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                            <input value={form[k] ?? ''} onChange={e => set({ [k]: e.target.value })} className="form-input w-full py-1" /></div>
                    ))}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="form-checkbox" checked={!!form.is_active} onChange={e => set({ is_active: e.target.checked })} /> Hiển thị</label>
                    <div className="sm:col-span-2 flex gap-2 justify-end">
                        <button onClick={() => setForm(null)} className="btn-sm border-gray-200 text-gray-600">Huỷ</button>
                        <button onClick={save} className="btn-sm bg-indigo-600 text-white">Lưu</button>
                    </div>
                </div>
            )}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {items.map(v => (
                    <div key={v.id} className={`rounded-lg border overflow-hidden ${v.is_active ? '' : 'opacity-50'}`}>
                        <a href={v.video_url} target="_blank" rel="noreferrer" className="block aspect-[9/16] bg-gray-900">
                            {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                        </a>
                        <div className="p-2 text-xs">
                            <div className="font-semibold text-green-600">{v.earned ? `+ ${v.earned}` : '—'}</div>
                            <div className="text-gray-500 truncate">♥ {v.likes || '—'} · 👁 {v.views || '—'} · {v.handle || ''}</div>
                            <div className="text-gray-400">{v.platform} · #{v.display_order}</div>
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => { setForm({ ...EMPTY_VIDEO, ...v }); setErr(''); setMsg(''); }} className="text-indigo-600">Sửa</button>
                                <button onClick={() => remove(v)} className="text-red-500">Xoá</button>
                            </div>
                        </div>
                    </div>
                ))}
                {!items.length && <div className="col-span-full text-sm text-gray-400">Chưa có video.</div>}
            </div>
        </Card>
    );
}

function Creators() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(null);
    const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
    const load = useCallback(async () => { try { setItems(await authed('/admin/creator-program/creators')); } catch (e) { setErr(e.message); } }, []);
    useEffect(() => { load(); }, [load]);
    const set = (p) => setForm(f => ({ ...f, ...p }));
    const save = async () => {
        setErr(''); setMsg('');
        try {
            const body = JSON.stringify({ ...form, display_order: Number(form.display_order) || 0 });
            if (form.id) await authed(`/admin/creator-program/creators/${form.id}`, { method: 'PUT', body });
            else await authed('/admin/creator-program/creators', { method: 'POST', body });
            setForm(null); setMsg('Đã lưu.'); await load();
        } catch (e) { setErr(e.message); }
    };
    const remove = async (c) => {
        if (!window.confirm(`Xoá ${c.name}?`)) return;
        try { await authed(`/admin/creator-program/creators/${c.id}`, { method: 'DELETE' }); await load(); } catch (e) { setErr(e.message); }
    };
    return (
        <Card>
            <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Thẻ creator ở mục "They Started with Zero Experience". Chỉ đăng creator thật, đã đồng ý cho dùng tên/ảnh, với số tiền thật đã trả.</div>
                <button onClick={() => { setForm({ ...EMPTY_CREATOR }); setErr(''); setMsg(''); }} className="btn-sm bg-indigo-600 text-white whitespace-nowrap">+ Thêm creator</button>
            </div>
            <Msg msg={msg} err={err} />
            {form && (
                <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2"><ImageField label="Ảnh đại diện" value={form.avatar_url} onChange={v => set({ avatar_url: v })} /></div>
                    {[['name', 'Tên'], ['earned', 'Đã nhận (vd $1,200)'], ['subtitle', 'Mô tả ngắn (tuổi, nghề, nơi ở)'], ['note', 'Ghi chú nghiêng'], ['profile_url', 'Link kênh (tuỳ chọn)'], ['display_order', 'Thứ tự']].map(([k, l]) => (
                        <div key={k}><label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                            <input value={form[k] ?? ''} onChange={e => set({ [k]: e.target.value })} className="form-input w-full py-1" /></div>
                    ))}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="form-checkbox" checked={!!form.is_active} onChange={e => set({ is_active: e.target.checked })} /> Hiển thị</label>
                    <div className="sm:col-span-2 flex gap-2 justify-end">
                        <button onClick={() => setForm(null)} className="btn-sm border-gray-200 text-gray-600">Huỷ</button>
                        <button onClick={save} className="btn-sm bg-indigo-600 text-white">Lưu</button>
                    </div>
                </div>
            )}
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {items.map(c => (
                    <div key={c.id} className={`rounded-lg border p-3 ${c.is_active ? '' : 'opacity-50'}`}>
                        <div className="flex items-center gap-3">
                            {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-200" />}
                            <div><div className="font-semibold">{c.name}</div><div className="text-indigo-600 font-bold">{c.earned}</div></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{c.subtitle}</div>
                        <div className="text-xs text-gray-400 italic">{c.note}</div>
                        <div className="flex gap-2 mt-2 text-xs">
                            <button onClick={() => { setForm({ ...EMPTY_CREATOR, ...c }); setErr(''); setMsg(''); }} className="text-indigo-600">Sửa</button>
                            <button onClick={() => remove(c)} className="text-red-500">Xoá</button>
                        </div>
                    </div>
                ))}
                {!items.length && <div className="col-span-full text-sm text-gray-400">Chưa có creator.</div>}
            </div>
        </Card>
    );
}

function Settings() {
    const [countries, setCountries] = useState([]);
    const [total, setTotal] = useState('');
    const [add, setAdd] = useState('');
    const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
    useEffect(() => {
        authed('/admin/creator-program/settings').then(d => { setCountries(d.countries || []); setTotal(d.total_earned || ''); }).catch(e => setErr(e.message));
    }, []);
    const move = (i, d) => setCountries(cs => { const a = [...cs]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
    const save = async () => {
        setErr(''); setMsg('');
        try { await authed('/admin/creator-program/settings', { method: 'PUT', body: JSON.stringify({ countries, total_earned: total }) }); setMsg('Đã lưu.'); }
        catch (e) { setErr(e.message); }
    };
    return (
        <Card>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Quốc gia hiện trong form đăng ký</div>
            <div className="text-xs text-gray-500 mb-3">Chọn quốc gia đang cần creator; "Other country" luôn có ở cuối (kèm cảnh báo chưa hỗ trợ trả tiền).</div>
            <div className="flex flex-wrap gap-2">
                {countries.map((c, i) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full border border-gray-200 pl-3 pr-1 py-1 text-sm">
                        <b className="text-xs text-gray-500">{c}</b> {countryName(c)}
                        <button onClick={() => move(i, -1)} className="px-1 text-gray-400 hover:text-gray-700" title="Lên">‹</button>
                        <button onClick={() => move(i, 1)} className="px-1 text-gray-400 hover:text-gray-700" title="Xuống">›</button>
                        <button onClick={() => setCountries(cs => cs.filter(x => x !== c))} className="px-1.5 text-red-400 hover:text-red-600" title="Bỏ">×</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2 mt-3">
                <select value={add} onChange={e => setAdd(e.target.value)} className="form-select py-1">
                    <option value="">— Thêm quốc gia —</option>
                    {ALL_COUNTRY_CODES.filter(c => !countries.includes(c)).map(c => <option key={c} value={c}>{countryName(c)} ({c})</option>)}
                </select>
                <button disabled={!add} onClick={() => { setCountries(cs => [...cs, add]); setAdd(''); }} className="btn-sm border-gray-200 text-gray-600 disabled:opacity-40">Thêm</button>
            </div>

            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-6">Dòng "Our creators have already earned …!"</div>
            <div className="text-xs text-gray-500 mb-2">Điền phần sau chữ "earned", vd <i>thousands of dollars</i> hoặc <i>over $20,000</i> — hiện ở hero và câu "Is this legit?" trong FAQ. Để trống thì ẩn. Chỉ điền khi đúng với số tiền thật đã chi trả (tab Thu nhập creator).</div>
            <input value={total} onChange={e => setTotal(e.target.value)} placeholder="vd thousands of dollars" className="form-input py-1 w-72" />

            <div className="mt-5"><button onClick={save} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Lưu cài đặt</button></div>
            <Msg msg={msg} err={err} />
        </Card>
    );
}

const TABS = [
    ['apps', 'Đơn đăng ký'], ['access', 'Quyền Creator Hub'], ['overview', 'Tổng quan creator'],
    ['channels', 'Kênh'], ['recon', 'Đối soát views'], ['bonus', 'Cài đặt thưởng'], ['earnings', 'Thu nhập creator'], ['leaderboard', 'Bảng xếp hạng'],
    ['videos', 'Video creator (landing)'], ['creators', 'Creator tiêu biểu (landing)'], ['settings', 'Cài đặt'],
];

export default function CreatorProgram() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tab, setTab] = useState('apps');
    return (
        <div className="flex h-[100dvh] overflow-hidden">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="grow">
                    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Work With Us (UGC Creator)</h1>
                            <a href="https://englishoncomputer.com/work-with-us" target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Xem trang ↗</a>
                        </div>
                        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
                            {TABS.map(([k, l]) => (
                                <button key={k} onClick={() => setTab(k)}
                                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{l}</button>
                            ))}
                        </div>
                        {tab === 'apps' && <Applications />}
                        {tab === 'access' && <HubAccess />}
                        {tab === 'overview' && <HubCreators />}
                        {tab === 'channels' && <HubChannels />}
                        {tab === 'recon' && <HubReconciliations />}
                        {tab === 'bonus' && <HubBonusSettings />}
                        {tab === 'earnings' && <HubEarnings />}
                        {tab === 'leaderboard' && <HubLeaderboard />}
                        {tab === 'videos' && <Videos />}
                        {tab === 'creators' && <Creators />}
                        {tab === 'settings' && <Settings />}
                    </div>
                </main>
            </div>
        </div>
    );
}
