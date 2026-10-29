/**
 * เมนูผู้ดูแลระบบ — ใช้ร่วมกันทั้งแถบเมนู (SidebarAdmin), ตัวกั้นหน้า (CheckAdmin) และตัวเลือกสิทธิ์ในหน้าจัดการผู้ใช้
 * key ต้องตรงกับ backend: User::ASSIGNABLE_MENUS และ middleware('menu:<key>') ใน routes/api.php
 */
export const ADMIN_MENUS = [
    { key: 'keywords',         label: 'จัดการคีย์เวิร์ด',         paths: ['/keywords'] },
    { key: 'bot_menu',         label: 'จัดการเมนูของบอท',     paths: ['/botManage'] },
    { key: 'chat_rooms',       label: 'จัดการห้องแชท',          paths: ['/chatRooms'] },
    { key: 'platform_routing', label: 'สิทธิ์การส่งต่อห้อง',      paths: ['/platform-routing'] },
    { key: 'short_chats',      label: 'จัดการข้อความส่งด่วน',    paths: ['/shortChats'] },
    { key: 'customers',        label: 'จัดการลูกค้า',           paths: ['/customers'] },
    { key: 'users',            label: 'จัดการผู้ใช้',            paths: ['/users'] },
    { key: 'help_chat',        label: 'จัดการ help Chat',      paths: ['/helpChat'] },
    { key: 'sticker',          label: 'จัดการ Sticker',        paths: ['/sticker'] },
    { key: 'tags',             label: 'จัดการ Tag จบสนทนา',    paths: ['/tags', '/tags-by-platforms'] },
    { key: 'holidays',         label: 'จัดการวันหยุด',          paths: ['/holidays'] },
    { key: 'knowledge_base',   label: 'Knowledge Base',        paths: ['/knowledge-base'] },
    { key: 'reports',          label: 'หน้ารายงาน',            paths: ['/report'] },
    { key: 'tokens',           label: 'จัดการ token',           paths: ['/accessToken'] },
    { key: 'auto_tokens',      label: 'Auto Access Token',     paths: ['/TokenManager'] },
    { key: 'tiktok_shop',      label: 'TikTok Shop (ออเดอร์/สินค้า)', paths: ['/tiktok-shop'] },
    { key: 'shopee_shop',      label: 'Shopee (ออเดอร์/สินค้า)',      paths: ['/shopee-shop'] },
    { key: 'lazada_shop',      label: 'Lazada (ออเดอร์/สินค้า)',      paths: ['/lazada-shop'] },
];

/** แพลตฟอร์มในหน้า "จัดการ token" — key ต้องตรงกับ backend: User::TOKEN_PLATFORMS */
export const TOKEN_PLATFORMS = [
    { key: 'line',     label: 'Line' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'shopee',   label: 'Shopee' },
    { key: 'lazada',   label: 'Lazada' },
    { key: 'tiktok',   label: 'TikTok' },
];

/** ผู้ใช้จัดการ token ของแพลตฟอร์มนี้ได้หรือไม่ — token_platforms ว่าง/null = ทุกแพลตฟอร์ม */
export function canAccessTokenPlatform(user, platform) {
    if (!user) return false;
    if (user.role === 'admin' || !Array.isArray(user.token_platforms) || user.token_platforms.length === 0) return true;
    return user.token_platforms.includes(String(platform ?? '').toLowerCase());
}

// เมนูที่ใช้ได้เฉพาะสิทธิ์ admin (ไม่เปิดให้กำหนดรายบุคคล)
const ADMIN_ONLY_PATHS = ['/announces'];

export function canAccessMenu(user, key) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Array.isArray(user.admin_menus) && user.admin_menus.includes(key);
}

/** มีเมนูผู้ดูแลระบบให้แสดงอย่างน้อย 1 เมนูหรือไม่ */
export function hasAnyAdminMenu(user) {
    return user?.role === 'admin' || (Array.isArray(user?.admin_menus) && user.admin_menus.length > 0);
}

/** เข้าหน้านี้ได้หรือไม่ — จับคู่ path กับเมนู (รองรับ path ย่อย เช่น /tags/groups/1/edit) */
export function canAccessPath(user, pathname) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
    const menu = ADMIN_MENUS.find((m) => m.paths.some((p) => pathname === p || pathname.startsWith(p + '/')));
    return menu ? canAccessMenu(user, menu.key) : false;
}
