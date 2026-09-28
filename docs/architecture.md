# Architecture

Sideboot is one screen and three pure modules. The UI asks. `plan.ts` decides. `iso.ts` reads a header. `store.ts` remembers.

## Verdict

`assess()` in `src/lib/plan.ts` takes platform, root, data cable, spare stick, and firmware. It returns one path.

Order:

1. iPhone → PC / Rufus. An iPhone cannot be a USB drive.
2. Computer → PC / Rufus.
3. Android, rooted, data cable → host the ISO as a CD-ROM.
4. Android, rooted, no data cable → same path, blocked until the cable is real.
5. Android, root unknown → write a stick only if a stick is attached and the PC is not Legacy-only. Otherwise carry the ISO to a PC. The UI still offers a one-tap switch to Rooted.
6. Android, stock, stick, not Legacy → unpack onto FAT32.
7. Android, stock, stick, Legacy → PC. A FAT32 extract does not boot old BIOS.
8. Android, stock, no stick → carry the ISO.

The user can override the path. Changing phone, root, cable, stick, Windows version, or firmware clears the override so the recommendation wins again.

Platform comes from the user agent unless Plan for is set to Android, iPhone, or Computer. That override exists so the plan can be written on a desktop for a phone that is not the browser.

## State

`useWorkshop` persists step, plan target, root, cable, stick, Windows release, firmware, path override, PC brand, and checklist ticks. The ISO report is not stored. A `File` cannot be saved, and the header is re-read when the file is chosen again.

Hydration waits on `skipHydration` plus `rehydrate()` so the server render and the first client render match.

## ISO inspector

`inspectImage(size, name, read)` never loads the whole file. `inspectFile` passes `file.slice`. Checks, in order:

1. Smaller than 64 bytes → not an image.
2. `MZ` → Windows program, not an ISO.
3. `PK` → zip, not an ISO.
4. Smaller than 17 sectors → incomplete.
5. Up to eight volume descriptors from sector 16. Type 1 is the primary volume. Type 0 with `EL TORITO` is the boot record. The catalog LBA is the little-endian dword at offset 71.
6. Sector 256, tag id 2 → UDF anchor.
7. Boot catalog: header `0x01`, key `0x55 0xAA`, default entry boot indicator `0x88`.

Microsoft is inferred from the system identifier containing `MICROSOFT`, or a volume id matching `CCCOMA`, `CCSENA`, `ESD-ISO`, `CWCOEM`, `WIN11`, `WIN10`, or `WINDOWS`. Architecture is read from the volume id (`X64`, `ARM64`, `X86`).

## UI

`workshop.tsx` is the product. Steps are Phone, Image, Path, Bench. The bottom bar is fixed. Checklist and brand are buttons with `aria-pressed`. Root and firmware are radio groups. Cable and stick are switches.

Colors live in `src/styles.css`: oil `#12110e`, paper `#f3efe4`, volt `#dff25a`. One accent.

## Scripts

`probeScript`, `hostScript`, and `restoreScript` are generated as text and also checked in under `scripts/` with a default ISO path of `/sdcard/Download/windows.iso`. The UI rewrites the host path from the file name the inspector saw, keeping only a safe basename.

The host script refuses to run unless the legacy `android_usb` gadget and a mass-storage LUN exist. It sets the LUN file, the CD-ROM flag, and read-only. It does not try to invent a configfs gadget. DriveDroid covers more phones than these scripts do.
