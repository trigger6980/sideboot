export type Platform = "android" | "ios" | "desktop";
export type PlanFor = "auto" | Platform;
export type RootState = "rooted" | "stock" | "unsure";
export type ReleaseId = "win11" | "win10";
export type Firmware = "uefi" | "legacy" | "both";
export type PathId = "phone-cdrom" | "otg-fat32" | "pc-rufus";

export type VerdictId =
  | "host"
  | "cable"
  | "unsure"
  | "write"
  | "legacy"
  | "carry"
  | "iphone"
  | "computer";

export type Assessment = {
  verdict: VerdictId;
  path: PathId;
  kicker: string;
  title: string;
  body: string;
};

export type BenchItem = {
  id: string;
  title: string;
  detail: string;
};

export type BootKey = {
  id: string;
  name: string;
  key: string;
  note: string;
};

export const RELEASES: { id: ReleaseId; name: string; hint: string; href: string }[] = [
  {
    id: "win11",
    name: "Windows 11",
    hint: "Current installer. Usually 5.5–7 GB.",
    href: "https://www.microsoft.com/software-download/windows11",
  },
  {
    id: "win10",
    name: "Windows 10",
    hint: "22H2, for older PCs. Usually 4–6 GB.",
    href: "https://www.microsoft.com/software-download/windows10",
  },
];

export const FIRMWARES: { id: Firmware; name: string; hint: string }[] = [
  { id: "uefi", name: "UEFI", hint: "PCs from about 2012 on" },
  { id: "legacy", name: "Legacy", hint: "Old BIOS only" },
  { id: "both", name: "Not sure", hint: "Plan for both" },
];

export const BOOT_KEYS: BootKey[] = [
  { id: "dell", name: "Dell", key: "F12", note: "Tap F12 as the logo appears. Some models need Fn+F12." },
  { id: "hp", name: "HP", key: "Esc", note: "Tap Esc, then F9 for the boot menu. F10 is setup, not the menu." },
  { id: "lenovo", name: "Lenovo", key: "F12", note: "ThinkPad: F12. IdeaPad: Fn+F12, or the Novo pinhole while the PC is off." },
  { id: "asus", name: "ASUS", key: "Esc", note: "Tap Esc for the boot menu. F2 opens setup." },
  { id: "acer", name: "Acer", key: "F12", note: "F12 is often disabled until you turn on F12 Boot Menu in BIOS." },
  { id: "msi", name: "MSI", key: "F11", note: "Tap F11. Del opens setup." },
  { id: "gigabyte", name: "Gigabyte", key: "F12", note: "Tap F12. Aorus boards are the same." },
  { id: "asrock", name: "ASRock", key: "F11", note: "Tap F11 as the logo appears." },
  { id: "surface", name: "Surface", key: "Vol−", note: "Hold volume down, press and release power, keep holding volume down." },
  { id: "framework", name: "Framework", key: "F12", note: "Tap F12. F2 is BIOS setup." },
  { id: "other", name: "Other", key: "F12", note: "Try Esc, F12, F11, F10, F9, then Del. One of those opens the menu or setup." },
];

export const PATHS: { id: PathId; name: string; short: string }[] = [
  { id: "phone-cdrom", name: "Phone as CD", short: "Rooted Android hosts the ISO" },
  { id: "otg-fat32", name: "Write a stick", short: "Unpack onto a USB drive" },
  { id: "pc-rufus", name: "Use a PC", short: "Rufus or Media Creation Tool" },
];

export function detectPlatform(ua: string): Platform {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "desktop";
}

export function assess(input: {
  platform: Platform;
  root: RootState;
  dataCable: boolean;
  otgStick: boolean;
  firmware: Firmware;
}): Assessment {
  const { platform, root, dataCable, otgStick, firmware } = input;

  if (platform === "ios") {
    return {
      verdict: "iphone",
      path: "pc-rufus",
      kicker: "Cannot be the stick",
      title: "An iPhone cannot boot a PC",
      body: "iOS does not let a website or an app turn the phone into a USB drive. Download the ISO if you want, then write it with Rufus on a Windows PC.",
    };
  }

  if (platform === "desktop") {
    return {
      verdict: "computer",
      path: "pc-rufus",
      kicker: "Use this computer",
      title: "Write the stick here",
      body: "This browser is on a computer. Rufus, or Microsoft's Media Creation Tool, is the reliable way to make Windows install media. A phone becomes the drive only when it is rooted Android.",
    };
  }

  if (root === "rooted" && dataCable) {
    return {
      verdict: "host",
      path: "phone-cdrom",
      kicker: "Can be the stick",
      title: "Host the Windows ISO as a CD",
      body: "Root can present the file as a USB CD-ROM. That is how a Windows ISO actually boots. The browser cannot flip the USB chip. DriveDroid, or the script on the path step, has to.",
    };
  }

  if (root === "rooted" && !dataCable) {
    return {
      verdict: "cable",
      path: "phone-cdrom",
      kicker: "Needs a data cable",
      title: "Root is enough. The cable is not.",
      body: "A charge-only cable never shows a drive to the PC. Get a data cable, then host the ISO as a CD-ROM.",
    };
  }

  if (root === "unsure") {
    return {
      verdict: "unsure",
      path: otgStick && firmware !== "legacy" ? "otg-fat32" : "pc-rufus",
      kicker: "Root is the switch",
      title: "This phone can be the stick only if it is rooted",
      body: "Sideboot cannot see root from the browser. If Magisk or another root manager is installed, choose Rooted. A stock phone cannot emulate a USB drive.",
    };
  }

  if (otgStick && firmware !== "legacy") {
    return {
      verdict: "write",
      path: "otg-fat32",
      kicker: "Can write a stick",
      title: "The phone stays a phone",
      body: "Without root, Android will not pretend to be a boot drive. You can unpack the installer onto a USB stick for a UEFI PC, if no single file is over 4 GB.",
    };
  }

  if (otgStick && firmware === "legacy") {
    return {
      verdict: "legacy",
      path: "pc-rufus",
      kicker: "Old BIOS, different stick",
      title: "A phone-made FAT32 stick will not boot Legacy",
      body: "Extracting the ISO only works for UEFI. Legacy BIOS needs Rufus on a PC, or a rooted phone hosting the ISO as a CD-ROM.",
    };
  }

  return {
    verdict: "carry",
    path: "pc-rufus",
    kicker: "Carry the ISO",
    title: "This phone cannot become the USB device",
    body: "Stock Android blocks the USB gadget a boot drive needs, and there is no spare stick attached. Download the official ISO and write it on a PC.",
  };
}

export function isoPhonePath(name: string | null): string {
  const base = (name ?? "windows.iso").split(/[/\\]/).pop() || "windows.iso";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "") || "windows.iso";
  return `/sdcard/Download/${cleaned}`;
}

export function probeScript(): string {
  return `#!/system/bin/sh
# Sideboot probe. Read only. Does not change USB mode.
echo "=== Sideboot probe ==="
getprop ro.product.model
getprop ro.build.version.release
echo "usb.config=$(getprop sys.usb.config)"
echo "usb.state=$(getprop sys.usb.state)"
for p in /sys/class/android_usb/android0 \\
  /config/usb_gadget /sys/kernel/config/usb_gadget
do
  if [ -e "$p" ]; then echo "FOUND $p"; else echo "MISS  $p"; fi
done
if [ -d /sys/class/android_usb/android0/f_mass_storage ]; then
  find /sys/class/android_usb/android0/f_mass_storage \\
    -maxdepth 2 -type f 2>/dev/null | head -n 40
fi
`;
}

export function hostScript(isoPath: string): string {
  return `#!/system/bin/sh
# Host a Windows ISO as a USB CD-ROM.
# Run as root: su -c 'sh sideboot-host.sh'
# Reboot the phone to restore normal USB.
ISO="${isoPath}"
A=/sys/class/android_usb/android0

if [ ! -d "$A" ]; then
  echo "No legacy android_usb gadget."
  echo "Use DriveDroid's USB wizard instead."
  exit 1
fi
if [ ! -f "$ISO" ]; then
  echo "ISO not found: $ISO"
  exit 1
fi

LUN="$A/f_mass_storage/lun0"
if [ ! -e "$LUN/file" ]; then
  LUN="$A/f_mass_storage/lun"
fi
if [ ! -e "$LUN/file" ]; then
  echo "No mass-storage LUN on this kernel."
  exit 1
fi

echo 0 > "$A/enable"
echo mass_storage > "$A/functions"
echo "$ISO" > "$LUN/file"
if [ -e "$LUN/cdrom" ]; then echo 1 > "$LUN/cdrom"; fi
if [ -e "$LUN/ro" ]; then echo 1 > "$LUN/ro"; fi
echo 1 > "$A/enable"
echo "Hosting as CD-ROM: $ISO"
echo "Plug in a data cable and open the PC boot menu."
`;
}

export function restoreScript(): string {
  return `#!/system/bin/sh
# Best effort. Reboot if the PC still sees a disc.
A=/sys/class/android_usb/android0
if [ ! -d "$A" ]; then
  echo "Reboot the phone to rebuild the USB gadget."
  exit 0
fi
echo 0 > "$A/enable"
echo mtp,adb > "$A/functions"
echo "" > "$A/f_mass_storage/lun0/file" 2>/dev/null || true
echo 1 > "$A/enable"
echo "Asked for mtp,adb. Reboot if transfer is still wrong."
`;
}

export type MethodStep = { title: string; body: string };
export type MethodLink = { label: string; href: string };

export type Method = {
  id: PathId;
  kicker: string;
  title: string;
  lede: string;
  steps: MethodStep[];
  caution: string | null;
  scripts: Array<"probe" | "host" | "restore">;
  links: MethodLink[];
};

const WIN11 = "https://www.microsoft.com/software-download/windows11";
const WIN10 = "https://www.microsoft.com/software-download/windows10";
const RUFUS = "https://rufus.ie/en/";
const DRIVEDROID = "https://play.google.com/store/apps/details?id=com.softwarebakery.drivedroid";
const DRIVEDROID_SITE = "https://www.drivedroid.io/";
const ZARCHIVER = "https://play.google.com/store/apps/details?id=ru.zdevs.zarchiver";

export function methodFor(
  path: PathId,
  release: ReleaseId,
  firmware: Firmware,
  platform: Platform,
): Method {
  const isoHref = release === "win11" ? WIN11 : WIN10;
  const isoName = release === "win11" ? "Windows 11" : "Windows 10";

  if (path === "phone-cdrom") {
    const uefiNote =
      firmware !== "legacy"
        ? "Some UEFI boards never list a USB CD-ROM. If the phone does not appear in the boot menu, that board cannot boot a gadget optical drive. Use Rufus."
        : "Legacy BIOS usually likes a CD-ROM gadget more than UEFI does. Still try a USB-A port if the phone never shows up.";
    return {
      id: path,
      kicker: "Rooted Android",
      title: "The phone is the Windows disc",
      lede: "A Windows ISO is a disc, not a thumb drive. The phone has to pretend to be a CD-ROM. Handing the PC the file as a normal USB stick usually does not boot.",
      caution: uefiNote,
      scripts: ["probe", "host", "restore"],
      links: [
        { label: `Download ${isoName}`, href: isoHref },
        { label: "DriveDroid", href: DRIVEDROID },
        { label: "How DriveDroid works", href: DRIVEDROID_SITE },
      ],
      steps: [
        {
          title: "Download the ISO from Microsoft",
          body: `Save the official ${isoName} image in Downloads. Nothing else. Random “Windows ISO” sites ship tampered images. Windows 11 is about 6 GB, so leave a little free space past that.`,
        },
        {
          title: "Let DriveDroid own the USB port",
          body: "Install DriveDroid, grant root, and run its USB setup wizard. Keep the USB system it marks as working. Android 12 and newer — Samsung and Pixel especially — often have no working system. If the wizard finds nothing, this phone cannot be the stick.",
        },
        {
          title: "Host the image as a CD-ROM",
          body: "Add the ISO from local storage. Choose the CD-ROM host mode, not a writable USB disk. Windows setup reads it like a disc, so the 4 GB FAT32 limit does not apply.",
        },
        {
          title: "Use a data cable",
          body: "Charge-only cables fail silently: the phone charges, the PC sees nothing. Prefer a USB-A port on the desktop. Some laptop USB-C ports never boot a gadget CD.",
        },
        {
          title: "Boot the PC from that disc",
          body: "Open the firmware boot menu and pick the USB CD, DVD, or DriveDroid entry. Leave Secure Boot on for an official Microsoft image. You want the blue Windows Setup window, not a desktop. The phone is only the disc. Windows installs onto the PC's drive.",
        },
        {
          title: "Give the phone its port back",
          body: "Leave it plugged in until Windows finishes copying files. Then reboot the phone. File transfer and normal charging come back after the gadget is released.",
        },
      ],
    };
  }

  if (path === "otg-fat32") {
    return {
      id: path,
      kicker: "No root",
      title: "Fill a real USB stick from the phone",
      lede: "Stock Android cannot turn the phone itself into a boot device. It can unpack the installer onto a stick you attach with OTG. That stick boots UEFI only, and only if every file is under 4 GB.",
      caution:
        "EtchDroid and other raw writers are built for Linux images. They usually do not make a working Windows installer. Do not dd the ISO onto the stick.",
      scripts: [],
      links: [
        { label: `Download ${isoName}`, href: isoHref },
        { label: "ZArchiver", href: ZARCHIVER },
      ],
      steps: [
        {
          title: "Get a stick the phone can format",
          body: "16 GB is enough, 32 GB is the comfortable maximum. Larger sticks often will not format as FAT32 from a phone. You need an OTG adapter if the phone port does not take the stick directly.",
        },
        {
          title: "Download the official ISO",
          body: `Get ${isoName} from Microsoft and keep it in Downloads.`,
        },
        {
          title: "Format the stick as FAT32",
          body: "Not exFAT, not NTFS. A phone-made exFAT stick often will not show up in a UEFI boot menu.",
        },
        {
          title: "Extract the disc onto the stick",
          body: "ZArchiver can open an ISO. Extract to the root of the stick so boot, efi, sources, and bootmgr sit at the top. If they land inside a folder, the PC will not boot.",
        },
        {
          title: "Check sources/install.wim",
          body: "If that file is over 4 GB, FAT32 will refuse it. Many Windows 11 downloads hit this. Stop. Use Rufus on a PC, or root the phone and host the ISO as a CD.",
        },
        {
          title: "UEFI boot, Secure Boot left on",
          body: "Pick the USB entry in the firmware menu. This layout does not boot Legacy BIOS. Official Microsoft files are signed, so Secure Boot can stay on.",
        },
      ],
    };
  }

  const desktopLede =
    platform === "ios"
      ? "An iPhone cannot emulate a USB drive. The working path is a Windows PC and Rufus."
      : platform === "desktop"
        ? "You are already on a computer. Write the stick here. A phone only becomes the drive if it is rooted Android and the kernel still exposes USB mass storage."
        : "A browser cannot seize a phone's USB controller. Rufus on a Windows PC is the method that handles every Windows image, including install files bigger than 4 GB.";

  return {
    id: path,
    kicker: "Reliable path",
    title: "Write the stick on a computer",
    lede: desktopLede,
    caution:
      firmware === "legacy"
        ? "In Rufus, set MBR and BIOS (or UEFI-CSM). GPT plus UEFI will not boot a Legacy-only PC."
        : null,
    scripts: [],
    links: [
      { label: `Download ${isoName}`, href: isoHref },
      { label: "Rufus", href: RUFUS },
    ],
    steps: [
      {
        title: "Get the image from Microsoft",
        body: "On a phone, the download page usually offers the ISO directly. On Windows it pushes the Media Creation Tool, which also makes a bootable stick and avoids the 4 GB problem.",
      },
      {
        title: "Move the ISO to the PC if it is on the phone",
        body: "Use a data cable and pick file transfer. A charge-only cable shows charging and no files.",
      },
      {
        title: "Let Rufus write the stick",
        body: "Select the USB drive and the ISO. For a modern PC: GPT, UEFI. Leave the rest. Rufus splits or remaps install.wim when it is over 4 GB. An 8 GB stick is enough.",
      },
      {
        title: "Boot that stick",
        body: "Open the firmware boot menu and choose the USB entry. Leave Secure Boot on. Setup will ask for Home or Pro. You can install without a product key and activate later.",
      },
    ],
  };
}

export function benchFor(path: PathId, release: ReleaseId): BenchItem[] {
  const name = release === "win11" ? "Windows 11" : "Windows 10";
  if (path === "phone-cdrom") {
    return [
      { id: "cd-space", title: "Free space for the ISO", detail: `${name} needs roughly 6 GB free, plus a little room.` },
      { id: "cd-iso", title: "Official ISO in Downloads", detail: "Checked in Sideboot, label says Microsoft." },
      { id: "cd-root", title: "DriveDroid has root", detail: "USB wizard found a working system for this phone." },
      { id: "cd-mode", title: "Image hosted as CD-ROM", detail: "Not writable USB. Windows ISOs are discs." },
      { id: "cd-cable", title: "Data cable, USB-A if you can", detail: "The PC should see a disc, not just charging." },
      { id: "cd-boot", title: "Firmware boot menu", detail: "USB CD, DVD, or DriveDroid. Secure Boot stays on." },
      { id: "cd-setup", title: "Blue Windows Setup is on screen", detail: "Leave the phone plugged in until files finish copying." },
      { id: "cd-restore", title: "Reboot the phone after", detail: "That gives file transfer and normal charging back." },
    ];
  }
  if (path === "otg-fat32") {
    return [
      { id: "otg-stick", title: "FAT32 stick, 32 GB or smaller", detail: "exFAT from a phone often will not boot." },
      { id: "otg-iso", title: `${name} ISO from Microsoft`, detail: "Not a re-packed download." },
      { id: "otg-extract", title: "boot, efi, sources, bootmgr at the root", detail: "Not buried in a folder." },
      { id: "otg-wim", title: "install.wim is under 4 GB", detail: "If it is larger, stop and use Rufus or a rooted phone." },
      { id: "otg-boot", title: "UEFI USB entry", detail: "Legacy BIOS will not boot this layout." },
    ];
  }
  return [
    { id: "pc-iso", title: `${name} from Microsoft`, detail: "ISO on the phone, or Media Creation Tool on the PC." },
    { id: "pc-move", title: "File is on the PC that will run Rufus", detail: "Data cable, not charge-only." },
    { id: "pc-rufus", title: "Rufus write finished", detail: "GPT and UEFI for a modern PC. MBR for Legacy." },
    { id: "pc-boot", title: "Booted the USB entry", detail: "Setup asks for Home or Pro. A key can wait." },
  ];
}

export const TROUBLES: { title: string; body: string }[] = [
  {
    title: "The phone only charges",
    body: "The cable has no data wires, or the USB gadget never switched. Try another cable. A notification that only says charging means the PC does not see a drive.",
  },
  {
    title: "The boot menu has no phone",
    body: "Try a USB 2.0 port on the back of a desktop. Confirm the image is hosted as a CD-ROM, not a USB disk. Some boards cannot boot a phone gadget at all.",
  },
  {
    title: "No bootable device",
    body: "A Windows ISO is not a hybrid USB image. Linux ISOs often are. Host it as a CD, extract it correctly onto FAT32, or let Rufus build the stick.",
  },
  {
    title: "The copy dies on install.wim",
    body: "That file is over 4 GB. FAT32 cannot store it. Rufus, or a rooted phone in CD-ROM mode, is the way through.",
  },
  {
    title: "Secure Boot refuses the image",
    body: "Official Microsoft media is signed. If a CD gadget trips Secure Boot, the board does not trust USB optical boot. Write a Rufus stick instead of turning Secure Boot off for a mystery image.",
  },
  {
    title: "File transfer broke afterward",
    body: "The mass-storage gadget is still holding the port. Reboot the phone. The restore script is only a best effort.",
  },
];
