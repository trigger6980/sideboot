# Limits

This build is honest about the hardware. These are not bugs to paper over.

- A browser cannot switch the USB gadget. Root and a kernel interface are required. Sideboot generates the steps and the scripts. It does not become the drive by itself.
- iOS cannot emulate a USB mass-storage boot device.
- Windows ISOs are discs. USB-disk mode is the wrong shape.
- FAT32 cannot store a file over 4 GB. Many Windows 11 `install.wim` files are larger. The header check cannot see that size without walking the whole UDF tree, so it warns from the ISO size instead.
- DriveDroid and the legacy `android_usb` sysfs are not guaranteed on Android 12 or newer.
- Some UEFI firmware never lists a USB CD-ROM. The fallback is Rufus.
- Secure Boot should stay on for official Microsoft media. A gadget CD that the board will not trust is a reason to use Rufus, not a reason to disable Secure Boot for a random image.
- The restore script asks the gadget for `mtp,adb`. Some phones use a different USB composition. Reboot is the reliable restore.
- Sideboot does not include Windows, a product key, or a way to activate Windows.
- Sideboot does not install Windows onto the phone.
- The inspector does not verify Microsoft's signature. "The label says Microsoft" is not the same as "this file is unmodified." Download it yourself.
