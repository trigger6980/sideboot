# Operator guide

Use this on the phone while the PC is off.

## Before you start

- Download Windows only from Microsoft.
  - Windows 11: https://www.microsoft.com/software-download/windows11
  - Windows 10: https://www.microsoft.com/software-download/windows10
- A Windows 11 ISO is about 6 GB. Leave free space past that.
- You want a data cable. A charge-only cable never shows a drive.
- The blue Windows Setup window is success. The phone does not become a Windows PC.

## If the phone is rooted

1. In Sideboot, set Plan for **Android** and **Rooted**. Leave **Data cable** on.
2. On Image, pick the Windows version and UEFI unless the PC is old BIOS-only.
3. Open the ISO with **Choose an ISO**. You want the label **Microsoft Windows**, El Torito bootable, and x64 for a normal PC. ARM64 is the wrong image for most machines.
4. On Path, stay on **Phone as CD**.
5. Install DriveDroid, grant root, and run its USB setup wizard. Keep the USB system it marks as working.
6. Add the ISO. Host it as a **CD-ROM**, not a writable USB disk.
7. Plug the data cable into the PC. A USB-A port on the back of a desktop is the least fussy.
8. Power the PC on and open the boot menu. Pick the USB CD, DVD, or DriveDroid entry. Leave Secure Boot on.
9. Leave the phone plugged in until Windows finishes copying files.
10. Reboot the phone so file transfer and normal charging come back.

If DriveDroid finds no USB system, the kernel cannot do this. Use a PC. The scripts in `scripts/` only work when `/sys/class/android_usb/android0` exists. Run the probe first. It does not change USB mode.

```sh
su -c 'sh sideboot-probe.sh'
```

Host only after the probe prints `FOUND` for `android_usb`:

```sh
su -c 'sh sideboot-host.sh'
```

Edit `ISO=` in `sideboot-host.sh` if the file is not in `/sdcard/Download/`.

## If the phone is not rooted and you have a stick

1. Set **Stock** and turn **Spare USB stick** on. Firmware must not be Legacy-only.
2. Use a stick of 32 GB or smaller so the phone will format it as FAT32. Not exFAT.
3. Extract the ISO onto the root of the stick. You should see `boot`, `efi`, `sources`, and `bootmgr`, not a folder that contains them.
4. If `sources/install.wim` is larger than 4 GB, the copy will fail. Stop.
5. Boot the PC from the USB entry in UEFI mode.

## If neither of those fits

Copy the ISO to a Windows PC with a data cable and write it with Rufus.

- Modern PC: GPT, UEFI.
- Legacy BIOS: MBR, BIOS or UEFI-CSM.

## Boot menu keys

| PC | Key | Note |
| --- | --- | --- |
| Dell | F12 | Some models need Fn+F12 |
| HP | Esc, then F9 | F10 is setup, not the menu |
| Lenovo | F12 | IdeaPad may need Fn+F12 or the Novo pinhole |
| ASUS | Esc | F2 opens setup |
| Acer | F12 | Often disabled until enabled in BIOS |
| MSI | F11 | Del opens setup |
| Gigabyte | F12 | Aorus is the same |
| ASRock | F11 | Tap it as the logo appears |
| Surface | Volume down | Hold volume down, press and release power |
| Framework | F12 | F2 is setup |
| Other | F12 | Then Esc, F11, F10, F9, Del |

## When it fails

- Phone only charges: wrong cable, or the gadget never switched.
- Boot menu has no phone: try a USB 2.0 port. Confirm CD-ROM mode. Some boards cannot boot a phone gadget.
- "No bootable device" after a USB-disk mode: the Windows ISO is not a hybrid USB image. Host it as a CD, or use Rufus.
- Copy stops on `install.wim`: the file is over 4 GB.
- Secure Boot complains about an official Microsoft ISO on a CD gadget: that board does not trust USB optical boot. Use Rufus. Do not turn Secure Boot off for an image you did not download yourself.
- File transfer is broken afterward: reboot the phone. `scripts/sideboot-restore.sh` is only a best effort.
