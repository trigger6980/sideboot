# Sideboot

Turn a rooted Android phone into Windows install media. If the phone cannot do that, Sideboot says so and gives the path that actually boots.

The phone is the disc. Windows installs onto the PC.

Built 27 September 2026. Source in this repo is the application that was written for that build, not a description of it.

## What it does

Four steps, saved on the device:

1. **Phone.** Detect the browser. Plan for this device, an Android phone, an iPhone, or a computer. On Android, record root, a data cable, and whether a spare USB stick is attached.
2. **Image.** Pick Windows 11 or Windows 10 and the PC firmware (UEFI, Legacy, or not sure). Official download links only. Optionally open an ISO already on the device. The check reads a few kilobytes of the header in the browser. The file is not uploaded.
3. **Path.** One recommended method, plus the other two if you override it.
4. **Bench.** A checklist, the firmware boot-menu key for common PC brands, and a short failure list.

## What a website cannot do

A page cannot flip a phone's USB controller.

| Device | Can the phone be the stick? |
| --- | --- |
| Android, rooted, kernel still exposes USB mass storage | Yes. Host the ISO as a USB CD-ROM. |
| Android, stock | No. It can unpack the installer onto a real stick, or carry the ISO to a PC. |
| iPhone | No. iOS does not allow USB gadget mass storage. |
| Computer | Write the stick here with Rufus or the Media Creation Tool. |

Android 12 and newer, especially Samsung and Pixel, often have no working USB gadget for this. If DriveDroid's wizard finds no USB system, stop. That phone cannot be the stick.

## Why CD-ROM, not a thumb drive

A Microsoft Windows ISO is an optical image (ISO 9660 / UDF, El Torito). It is not a hybrid USB image the way many Linux ISOs are. Presenting the file as a normal USB disk usually does not boot. Hosting it as a CD-ROM matches how Windows setup expects to be read, and it avoids the FAT32 4 GB file limit.

## The three paths

### Phone as CD

Rooted Android. DriveDroid hosts the ISO as a CD-ROM. Scripts in [`scripts/`](scripts/) are the fallback for older kernels that still expose `/sys/class/android_usb`. If the probe says that node is missing, do not keep writing sysfs. Reboot restores USB.

### Write a stick

No root, plus a USB stick (OTG if the phone needs it). Format FAT32, extract the ISO so `boot`, `efi`, `sources`, and `bootmgr` sit at the root of the stick. This boots UEFI only. If `sources/install.wim` is over 4 GB, FAT32 cannot hold it. Stop and use Rufus, or root the phone and host the ISO as a CD.

EtchDroid-style raw writers are for Linux images. They usually do not make a working Windows installer.

### Use a PC

Rufus. GPT and UEFI for a modern PC. MBR and BIOS/CSM for Legacy. Rufus handles an `install.wim` bigger than 4 GB. Leave Secure Boot on for an official Microsoft image.

## ISO check

[`src/lib/iso.ts`](src/lib/iso.ts) reads:

- The first bytes, so a Media Creation Tool `.exe` (MZ) or a zip is rejected.
- ISO 9660 volume descriptors at sector 16. System id and volume id. Microsoft consumer images often say `MICROSOFT CORPORATION` and `CCCOMA_X64FRE_…`.
- An El Torito boot record and the boot catalog (`0x55 0xAA`, boot indicator `0x88`).
- A UDF anchor at sector 256.

It does not unpack `install.wim`. A file over 4.5 GB is flagged because that WIM is often over the FAT32 limit. A file under 3 GB is flagged as smaller than a normal Windows install ISO.

## Source map

| Path | Role |
| --- | --- |
| [`src/lib/plan.ts`](src/lib/plan.ts) | Device verdict, the three methods, bench items, boot keys, shell scripts |
| [`src/lib/iso.ts`](src/lib/iso.ts) | Header inspector |
| [`src/lib/store.ts`](src/lib/store.ts) | Plan saved in `localStorage` |
| [`src/components/workshop.tsx`](src/components/workshop.tsx) | The four-step UI |
| [`src/styles.css`](src/styles.css) | Oil black, paper, volt. Outfit and IBM Plex Mono |
| [`src/routes/`](src/routes/) | App shell for the Grok app builder (TanStack Start) |
| [`scripts/`](scripts/) | Probe, host, and restore, as files you can copy to the phone |
| [`docs/operator.md`](docs/operator.md) | Step-by-step on the phone |
| [`docs/architecture.md`](docs/architecture.md) | How the verdict is chosen |
| [`docs/limits.md`](docs/limits.md) | What this build does not claim |

The live preview runs inside the Grok app builder. That shell also mounts platform pieces (`AuthProvider`, `PreviewHostBridge`) that are not this product and are not copied here. Sideboot does not use accounts or a database. The plan stays in the browser.

## Docs

- [Operator guide](docs/operator.md)
- [Architecture](docs/architecture.md)
- [Limits](docs/limits.md)
- [How this build was filed](docs/publish.md)

Sideboot does not include Windows. Download the image from Microsoft.

## License of the app code

The TypeScript, CSS, SVG, and shell in this repository are published so the build can be read and reused. Windows, DriveDroid, Rufus, and ZArchiver are their own projects.
