const SECTOR = 2048;

export type ImageKind = "windows" | "optical" | "not-image";
export type CpuArch = "x64" | "x86" | "arm64" | "unknown";

export type IsoReport = {
  name: string;
  size: number;
  kind: ImageKind;
  volumeId: string | null;
  systemId: string | null;
  iso9660: boolean;
  udf: boolean;
  elTorito: boolean;
  bootable: boolean;
  arch: CpuArch;
  microsoft: boolean;
  fat32Risk: boolean;
  notes: string[];
};

type Reader = (offset: number, length: number) => Promise<Uint8Array>;

function latin1(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i++) {
    const c = bytes[i] ?? 0;
    if (c !== 0) out += String.fromCharCode(c);
  }
  return out.trim();
}

function archFrom(volumeId: string): CpuArch {
  const v = volumeId.toUpperCase();
  if (v.includes("ARM64") || v.includes("A64")) return "arm64";
  if (v.includes("X64") || v.includes("AMD64")) return "x64";
  if (v.includes("X86") || v.includes("X32")) return "x86";
  return "unknown";
}

function looksMicrosoft(systemId: string, volumeId: string): boolean {
  const system = systemId.toUpperCase();
  const volume = volumeId.toUpperCase();
  if (system.includes("MICROSOFT")) return true;
  return /CCCOMA|CCSENA|ESD-ISO|CWCOEM|WIN11|WIN10|WINDOWS/.test(volume);
}

export function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "—";
  if (size < 1024) return `${Math.round(size)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export async function inspectImage(
  size: number,
  name: string,
  read: Reader,
): Promise<IsoReport> {
  const notes: string[] = [];
  const empty: IsoReport = {
    name,
    size,
    kind: "not-image",
    volumeId: null,
    systemId: null,
    iso9660: false,
    udf: false,
    elTorito: false,
    bootable: false,
    arch: "unknown",
    microsoft: false,
    fat32Risk: size >= 4.5 * 1024 * 1024 * 1024,
    notes,
  };

  if (size < 64) {
    notes.push("The file is too small to be a disc image.");
    return empty;
  }

  const head = await read(0, 8);
  if (head.length >= 2 && head[0] === 0x4d && head[1] === 0x5a) {
    notes.push(
      "This is a Windows program, not an ISO. It starts with the MZ header. On a phone you need the disc image from Microsoft, not the Media Creation Tool.",
    );
    return empty;
  }
  if (head.length >= 2 && head[0] === 0x50 && head[1] === 0x4b) {
    notes.push("This is a zip archive, not a Windows install disc.");
    return empty;
  }

  if (size < 17 * SECTOR) {
    notes.push("Too small for an ISO 9660 disc. The download is probably incomplete.");
    return empty;
  }

  const descriptors = await read(16 * SECTOR, 8 * SECTOR);
  let volumeId: string | null = null;
  let systemId: string | null = null;
  let iso9660 = false;
  let elTorito = false;
  let catalogLba = 0;

  for (let i = 0; i < 8; i++) {
    const off = i * SECTOR;
    if (off + 6 > descriptors.length) break;
    const type = descriptors[off] ?? 0;
    const id = latin1(descriptors, off + 1, 5);
    if (type === 255 && id === "CD001") break;
    if (id !== "CD001") continue;
    if (type === 1) {
      iso9660 = true;
      systemId = latin1(descriptors, off + 8, 32);
      volumeId = latin1(descriptors, off + 40, 32);
    }
    if (type === 0) {
      const bootSystem = latin1(descriptors, off + 7, 32).toUpperCase();
      if (bootSystem.includes("EL TORITO")) {
        elTorito = true;
        const b0 = descriptors[off + 71] ?? 0;
        const b1 = descriptors[off + 72] ?? 0;
        const b2 = descriptors[off + 73] ?? 0;
        const b3 = descriptors[off + 74] ?? 0;
        catalogLba = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
      }
    }
  }

  let udf = false;
  if (size >= 257 * SECTOR) {
    const avdp = await read(256 * SECTOR, 16);
    const tag = (avdp[0] ?? 0) | ((avdp[1] ?? 0) << 8);
    udf = tag === 2;
  }

  let bootable = false;
  if (elTorito && catalogLba > 0 && catalogLba * SECTOR + 64 <= size) {
    const catalog = await read(catalogLba * SECTOR, 64);
    const valid =
      catalog[0] === 0x01 && catalog[30] === 0x55 && catalog[31] === 0xaa;
    bootable = valid && catalog[32] === 0x88;
  }

  const microsoft = looksMicrosoft(systemId ?? "", volumeId ?? "");
  const arch = archFrom(volumeId ?? "");
  const optical = iso9660 || udf;
  const kind: ImageKind = microsoft && iso9660 ? "windows" : optical ? "optical" : "not-image";

  if (kind === "windows") {
    notes.push("Disc label matches Microsoft install media.");
  } else if (kind === "optical") {
    notes.push(
      "This is an optical image, but the label is not Microsoft's. Do not install Windows from a file you did not download yourself.",
    );
  } else {
    notes.push("No ISO 9660 or UDF header. This will not boot as a Windows disc.");
  }

  if (arch === "arm64") {
    notes.push("This image is ARM64. It is for a few ARM PCs, not a typical Intel or AMD machine.");
  }
  if (arch === "x86") {
    notes.push("This image is 32-bit. Most PCs from the last decade need the x64 image.");
  }

  const fat32Risk = size >= 4.5 * 1024 * 1024 * 1024;
  if (kind === "windows" && fat32Risk) {
    notes.push(
      "The file is over 4.5 GB. Windows 11's install.wim is often over 4 GB, which FAT32 cannot hold. Hosting the ISO as a CD avoids that limit. Copying the files onto a stick may not.",
    );
  }
  if (kind === "windows" && size < 3 * 1024 * 1024 * 1024) {
    notes.push("Smaller than a normal Windows install ISO. It may be incomplete, or only a repair disc.");
  }
  if (elTorito && !bootable) {
    notes.push("An El Torito boot record is present, but the catalog does not mark a bootable entry.");
  }
  if (kind === "windows" && !elTorito) {
    notes.push("No El Torito boot record. A PC is unlikely to boot this as a CD.");
  }

  const lower = name.toLowerCase();
  if (kind !== "not-image" && !lower.endsWith(".iso") && !lower.endsWith(".img")) {
    notes.push("The name does not end in .iso. The header still looks like a disc image.");
  }

  return {
    name,
    size,
    kind,
    volumeId,
    systemId,
    iso9660,
    udf,
    elTorito,
    bootable,
    arch,
    microsoft,
    fat32Risk,
    notes,
  };
}

export async function inspectFile(file: File): Promise<IsoReport> {
  return inspectImage(file.size, file.name, async (offset, length) => {
    const buf = await file.slice(offset, offset + length).arrayBuffer();
    return new Uint8Array(buf);
  });
}
