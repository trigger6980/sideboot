import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  HardDrive,
  Laptop,
  Smartphone,
  Usb,
} from "lucide-react";
import { formatBytes, inspectFile, type IsoReport } from "@/lib/iso";
import {
  BOOT_KEYS,
  FIRMWARES,
  PATHS,
  RELEASES,
  TROUBLES,
  assess,
  benchFor,
  detectPlatform,
  hostScript,
  isoPhonePath,
  methodFor,
  probeScript,
  restoreScript,
  type Firmware,
  type PathId,
  type PlanFor,
  type Platform,
  type ReleaseId,
  type RootState,
} from "@/lib/plan";
import { useWorkshop } from "@/lib/store";

const STEPS = [
  { id: 0, name: "Phone" },
  { id: 1, name: "Image" },
  { id: 2, name: "Path" },
  { id: 3, name: "Bench" },
] as const;

const PLAN_OPTIONS: { id: PlanFor; name: string; hint: string }[] = [
  { id: "auto", name: "This device", hint: "Match the browser" },
  { id: "android", name: "Android", hint: "Phone as the stick" },
  { id: "ios", name: "iPhone", hint: "Cannot host USB" },
  { id: "desktop", name: "Computer", hint: "Write it with Rufus" },
];

const ROOT_OPTIONS: { id: RootState; name: string }[] = [
  { id: "rooted", name: "Rooted" },
  { id: "stock", name: "Stock" },
  { id: "unsure", name: "Not sure" },
];

function platformName(platform: Platform): string {
  if (platform === "android") return "Android";
  if (platform === "ios") return "iPhone";
  return "Computer";
}

export function Workshop() {
  const step = useWorkshop((s) => s.step);
  const planFor = useWorkshop((s) => s.planFor);
  const root = useWorkshop((s) => s.root);
  const dataCable = useWorkshop((s) => s.dataCable);
  const otgStick = useWorkshop((s) => s.otgStick);
  const release = useWorkshop((s) => s.release);
  const firmware = useWorkshop((s) => s.firmware);
  const override = useWorkshop((s) => s.override);
  const brand = useWorkshop((s) => s.brand);
  const checks = useWorkshop((s) => s.checks);
  const patch = useWorkshop((s) => s.patch);
  const toggleCheck = useWorkshop((s) => s.toggleCheck);

  const [detected, setDetected] = useState<Platform | "pending">("pending");
  const [report, setReport] = useState<IsoReport | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const fileId = useId();

  useEffect(() => {
    void useWorkshop.persist.rehydrate();
    setDetected(detectPlatform(navigator.userAgent));
  }, []);

  const effective: Platform | null =
    planFor === "auto" ? (detected === "pending" ? null : detected) : planFor;
  const assessment = effective
    ? assess({ platform: effective, root, dataCable, otgStick, firmware })
    : null;
  const activePath: PathId = override ?? assessment?.path ?? "pc-rufus";
  const method = effective
    ? methodFor(activePath, release, firmware, effective)
    : null;
  const bench = benchFor(activePath, release);
  const done = bench.filter((item) => checks[item.id]).length;
  const boot = BOOT_KEYS.find((item) => item.id === brand) ?? BOOT_KEYS[0];
  const releaseMeta = RELEASES.find((item) => item.id === release) ?? RELEASES[0];

  const readout = [
    effective ? platformName(effective) : "Checking",
    effective === "android" ? (root === "rooted" ? "Rooted" : root === "stock" ? "Stock" : "Root?") : null,
    release === "win11" ? "Windows 11" : "Windows 10",
    firmware === "uefi" ? "UEFI" : firmware === "legacy" ? "Legacy" : "Firmware?",
    PATHS.find((item) => item.id === activePath)?.name ?? "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  function retarget(partial: {
    planFor?: PlanFor;
    root?: RootState;
    dataCable?: boolean;
    otgStick?: boolean;
    release?: ReleaseId;
    firmware?: Firmware;
  }) {
    patch({ ...partial, override: null });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setReadError(null);
    try {
      setReport(await inspectFile(file));
    } catch {
      setReport(null);
      setReadError(
        "Could not read that file. If it lives in the cloud, open it once so it is actually on the phone.",
      );
    } finally {
      setReading(false);
    }
  }

  const nextLabel = ["Choose the image", "Pick the path", "Open the bench", "Check another image"][step];

  function goNext() {
    patch({ step: step === 3 ? 1 : Math.min(3, step + 1) });
  }

  return (
    <div className="min-h-dvh bg-bg pb-24 text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-widest text-volt">SIDEBOOT</p>
              <h1 className="mt-1 text-2xl font-semibold text-fg sm:text-3xl">
                Boot Windows from a phone
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted">
                The phone is the install disc. Windows itself lands on the PC.
              </p>
            </div>
            <Usb className="mt-1 hidden size-8 shrink-0 text-volt sm:block" aria-hidden="true" />
          </div>
          <p className="font-mono text-xs text-soft">{readout}</p>
          <nav className="grid grid-cols-4 gap-1 lg:hidden" aria-label="Steps">
            {STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={step === item.id ? "step" : undefined}
                onClick={() => patch({ step: item.id })}
                className={
                  "min-h-11 rounded-md px-1 text-sm font-semibold transition-colors duration-200 " +
                  (step === item.id ? "bg-volt text-ink" : "bg-surface text-muted")
                }
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl lg:items-start lg:gap-8 lg:px-4">
        <aside className="sticky top-0 hidden w-56 shrink-0 pt-8 lg:block">
          <nav className="flex flex-col gap-1" aria-label="Steps">
            {STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-current={step === item.id ? "step" : undefined}
                onClick={() => patch({ step: item.id })}
                className={
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors duration-200 " +
                  (step === item.id ? "bg-volt text-ink" : "text-muted hover:bg-surface hover:text-fg")
                }
              >
                <span className="font-mono text-xs tabular-nums">0{index + 1}</span>
                {item.name}
              </button>
            ))}
          </nav>
          {assessment ? (
            <p className="mt-6 px-3 text-sm text-soft">{assessment.title}</p>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6">
          {step === 0 ? (
            <PhoneStep
              detected={detected}
              planFor={planFor}
              effective={effective}
              root={root}
              dataCable={dataCable}
              otgStick={otgStick}
              kicker={assessment?.kicker ?? "Checking"}
              title={assessment?.title ?? "Reading this browser"}
              body={
                assessment?.body ??
                "Sideboot is matching the plan to the device in front of you."
              }
              onPlan={(planForNext) => retarget({ planFor: planForNext })}
              onRoot={(rootNext) => retarget({ root: rootNext })}
              onCable={(value) => retarget({ dataCable: value })}
              onOtg={(value) => retarget({ otgStick: value })}
            />
          ) : null}

          {step === 1 ? (
            <ImageStep
              fileId={fileId}
              release={release}
              firmware={firmware}
              reading={reading}
              readError={readError}
              report={report}
              onRelease={(value) => retarget({ release: value })}
              onFirmware={(value) => retarget({ firmware: value })}
              onFile={(file) => void onFile(file)}
              onClear={() => {
                setReport(null);
                setReadError(null);
              }}
            />
          ) : null}

          {step === 2 && method && assessment && effective ? (
            <PathStep
              method={method}
              activePath={activePath}
              recommended={assessment.path}
              showRootShortcut={effective === "android" && root !== "rooted"}
              isoPath={isoPhonePath(report?.name ?? null)}
              onPick={(path) =>
                patch({ override: path === assessment.path ? null : path })
              }
              onRooted={() => retarget({ root: "rooted" })}
              onClearOverride={override ? () => patch({ override: null }) : null}
            />
          ) : null}

          {step === 3 ? (
            <BenchStep
              items={bench}
              done={done}
              checks={checks}
              bootId={boot.id}
              bootKey={boot.key}
              bootNote={boot.note}
              releaseHref={releaseMeta.href}
              releaseName={releaseMeta.name}
              onToggle={toggleCheck}
              onBrand={(id) => patch({ brand: id })}
            />
          ) : null}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => patch({ step: step - 1 })}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-surface px-3 text-sm font-semibold text-fg shadow-plate"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Back</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={goNext}
            className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-volt px-4 text-sm font-semibold text-ink"
          >
            {nextLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneStep(props: {
  detected: Platform | "pending";
  planFor: PlanFor;
  effective: Platform | null;
  root: RootState;
  dataCable: boolean;
  otgStick: boolean;
  kicker: string;
  title: string;
  body: string;
  onPlan: (value: PlanFor) => void;
  onRoot: (value: RootState) => void;
  onCable: (value: boolean) => void;
  onOtg: (value: boolean) => void;
}) {
  const detectedLabel =
    props.detected === "pending" ? "Checking…" : platformName(props.detected);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-panel bg-surface p-4 shadow-plate sm:p-5">
        <p className="font-mono text-xs tracking-widest text-volt uppercase">{props.kicker}</p>
        <h2 className="mt-2 text-2xl font-semibold text-fg">{props.title}</h2>
        <p className="mt-2 text-sm text-soft">{props.body}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Plan for</h2>
          <p className="font-mono text-xs text-muted">Browser: {detectedLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Plan for">
          {PLAN_OPTIONS.map((option) => (
            <Choice
              key={option.id}
              pressed={props.planFor === option.id}
              title={option.name}
              hint={option.hint}
              onClick={() => props.onPlan(option.id)}
            />
          ))}
        </div>
      </section>

      {props.effective === "android" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-fg">What this Android can do</h2>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1" role="radiogroup" aria-label="Root access">
            {ROOT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={props.root === option.id}
                onClick={() => props.onRoot(option.id)}
                className={
                  "min-h-11 rounded-md text-sm font-semibold transition-colors duration-200 " +
                  (props.root === option.id ? "bg-volt text-ink" : "text-muted")
                }
              >
                {option.name}
              </button>
            ))}
          </div>
          <SwitchRow
            label="Data cable"
            detail="Not a charge-only lead"
            checked={props.dataCable}
            onChange={props.onCable}
          />
          <SwitchRow
            label="Spare USB stick"
            detail="Plus OTG, if the phone needs it"
            checked={props.otgStick}
            onChange={props.onOtg}
          />
          <p className="text-sm text-muted">
            A website cannot flip the USB controller. Android only exposes mass storage to a rooted app, and plenty of phones on Android 12 and newer have a kernel that will not do it at all.
          </p>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-3">
          <Fact icon={<Smartphone className="size-5" />} title="Android, rooted" body="Can host the ISO as a USB CD-ROM." />
          <Fact icon={<Usb className="size-5" />} title="Android, stock" body="Can fill a real stick. Cannot become one." />
          <Fact icon={<Laptop className="size-5" />} title="iPhone or a PC" body="iPhone never. A PC should just run Rufus." />
        </section>
      )}
    </div>
  );
}

function ImageStep(props: {
  fileId: string;
  release: ReleaseId;
  firmware: Firmware;
  reading: boolean;
  readError: string | null;
  report: IsoReport | null;
  onRelease: (value: ReleaseId) => void;
  onFirmware: (value: Firmware) => void;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const report = props.report;
  const kindLabel =
    report?.kind === "windows"
      ? "Microsoft Windows"
      : report?.kind === "optical"
        ? "Other disc image"
        : "Not a disc";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">Windows image</h2>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Windows version">
          {RELEASES.map((item) => (
            <Choice
              key={item.id}
              pressed={props.release === item.id}
              title={item.name}
              hint={item.hint}
              onClick={() => props.onRelease(item.id)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {RELEASES.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg bg-surface-2 px-4 text-sm font-semibold text-fg shadow-plate"
            >
              Download {item.name}
            </a>
          ))}
        </div>
        <p className="text-sm text-muted">
          Microsoft only. On a phone the page usually offers the ISO. On Windows it offers the Media Creation Tool, which is fine if you are already at the PC.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">Firmware on the PC</h2>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1" role="radiogroup" aria-label="Firmware">
          {FIRMWARES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={props.firmware === item.id}
              onClick={() => props.onFirmware(item.id)}
              className={
                "min-h-11 rounded-md px-1 text-sm font-semibold transition-colors duration-200 " +
                (props.firmware === item.id ? "bg-volt text-ink" : "text-muted")
              }
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">
          {FIRMWARES.find((item) => item.id === props.firmware)?.hint}. UEFI is the right guess unless the PC is old enough to lack it.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">Check an image already on the device</h2>
        <label
          htmlFor={props.fileId}
          className="flex min-h-24 cursor-pointer flex-col items-start justify-center gap-1 rounded-panel bg-surface px-4 py-4 shadow-plate"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
            <HardDrive className="size-4 text-volt" aria-hidden="true" />
            {props.reading ? "Reading the disc header…" : "Choose an ISO"}
          </span>
          <span className="text-sm text-muted">
            Sideboot reads a few kilobytes of the header. It does not upload the file.
          </span>
        </label>
        <input
          id={props.fileId}
          type="file"
          accept=".iso,.img,application/octet-stream"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            props.onFile(file);
            event.target.value = "";
          }}
        />
        {props.readError ? <p className="text-sm text-soft">{props.readError}</p> : null}
        {report ? (
          <div className="rounded-panel bg-surface p-4 shadow-plate">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs tracking-widest text-volt uppercase">{kindLabel}</p>
                <h3 className="mt-1 break-all text-base font-semibold text-fg">{report.name}</h3>
              </div>
              <button
                type="button"
                onClick={props.onClear}
                className="min-h-11 shrink-0 rounded-md px-2 text-sm font-semibold text-muted"
              >
                Clear
              </button>
            </div>
            <dl className="mt-3">
              <Row k="Size" v={formatBytes(report.size)} />
              <Row k="Volume" v={report.volumeId || "—"} />
              <Row k="System" v={report.systemId || "—"} />
              <Row
                k="Format"
                v={
                  [report.iso9660 ? "ISO 9660" : null, report.udf ? "UDF" : null]
                    .filter(Boolean)
                    .join(" + ") || "—"
                }
              />
              <Row
                k="Boot"
                v={
                  report.bootable
                    ? "El Torito, bootable"
                    : report.elTorito
                      ? "El Torito, not marked bootable"
                      : "No El Torito record"
                }
              />
              <Row k="CPU" v={report.arch === "unknown" ? "Not in the label" : report.arch} />
            </dl>
            <ul className="mt-3 flex flex-col gap-2">
              {report.notes.map((note) => (
                <li key={note} className="text-sm text-soft">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PathStep(props: {
  method: ReturnType<typeof methodFor>;
  activePath: PathId;
  recommended: PathId;
  showRootShortcut: boolean;
  isoPath: string;
  onPick: (path: PathId) => void;
  onRooted: () => void;
  onClearOverride: (() => void) | null;
}) {
  const scripts = {
    probe: { title: "Probe the kernel", body: probeScript() },
    host: { title: "Host the ISO as a CD", body: hostScript(props.isoPath) },
    restore: { title: "Restore normal USB", body: restoreScript() },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2 sm:grid-cols-3">
        {PATHS.map((item) => {
          const active = item.id === props.activePath;
          const recommended = item.id === props.recommended;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => props.onPick(item.id)}
              className={
                "min-h-11 rounded-panel px-3 py-3 text-left shadow-plate transition-colors duration-200 " +
                (active ? "bg-volt text-ink" : "bg-surface text-fg")
              }
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{item.name}</span>
                {recommended ? (
                  <span className={"font-mono text-xs " + (active ? "text-ink" : "text-volt")}>
                    Best
                  </span>
                ) : null}
              </span>
              <span className={"mt-1 block text-xs " + (active ? "text-ink" : "text-muted")}>
                {item.short}
              </span>
            </button>
          );
        })}
      </div>

      {props.showRootShortcut && props.activePath !== "phone-cdrom" ? (
        <button
          type="button"
          onClick={props.onRooted}
          className="min-h-11 rounded-lg bg-surface-2 px-4 text-left text-sm font-semibold text-fg shadow-plate"
        >
          This phone is rooted — host the ISO as a CD
        </button>
      ) : null}

      {props.onClearOverride ? (
        <button
          type="button"
          onClick={props.onClearOverride}
          className="self-start text-sm font-semibold text-volt"
        >
          Back to the matching path
        </button>
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-volt uppercase">{props.method.kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold text-fg">{props.method.title}</h2>
          <p className="mt-2 text-sm text-soft">{props.method.lede}</p>
        </div>
        <ol className="flex flex-col gap-4">
          {props.method.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="pt-1 font-mono text-xs text-volt tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-fg">{step.title}</h3>
                <p className="text-sm text-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {props.method.caution ? (
          <p className="rounded-panel bg-surface px-4 py-3 text-sm text-soft shadow-plate">
            {props.method.caution}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {props.method.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg bg-surface-2 px-4 text-sm font-semibold text-fg shadow-plate"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {props.method.scripts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-fg">Scripts, if DriveDroid has no USB system</h2>
          <p className="text-sm text-muted">
            These talk to the old android_usb gadget. Run them as root from a terminal. If the probe says the gadget is missing, stop. Do not keep poking sysfs. Reboot puts USB back if a script leaves the port stuck. The host script expects the ISO at {props.isoPath}.
          </p>
          {props.method.scripts.map((key) => (
            <ScriptBlock key={key} title={scripts[key].title} body={scripts[key].body} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function BenchStep(props: {
  items: ReturnType<typeof benchFor>;
  done: number;
  checks: Record<string, boolean>;
  bootId: string;
  bootKey: string;
  bootNote: string;
  releaseHref: string;
  releaseName: string;
  onToggle: (id: string) => void;
  onBrand: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">While you do it</h2>
          <p className="font-mono text-xs text-muted tabular-nums">
            {props.done} of {props.items.length}
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {props.items.map((item) => {
            const on = Boolean(props.checks[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => props.onToggle(item.id)}
                  className="flex w-full min-h-11 items-start gap-3 rounded-panel bg-surface px-4 py-3 text-left shadow-plate"
                >
                  <span
                    className={
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md " +
                      (on ? "bg-volt text-ink" : "bg-surface-2 text-muted")
                    }
                    aria-hidden="true"
                  >
                    <Check className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">{item.title}</span>
                    <span className="block text-sm text-muted">{item.detail}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">Boot menu key</h2>
        <div className="flex flex-wrap gap-2">
          {BOOT_KEYS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={props.bootId === item.id}
              onClick={() => props.onBrand(item.id)}
              className={
                "min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 " +
                (props.bootId === item.id ? "bg-volt text-ink" : "bg-surface text-soft shadow-plate")
              }
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="rounded-panel bg-surface px-4 py-4 shadow-plate">
          <p className="font-mono text-5xl text-volt">{props.bootKey}</p>
          <p className="mt-2 text-sm text-soft">{props.bootNote}</p>
        </div>
      </section>

      <a
        href={props.releaseHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-volt px-4 text-sm font-semibold text-ink"
      >
        Open the {props.releaseName} download
      </a>

      <details className="rounded-panel bg-surface shadow-plate">
        <summary className="min-h-11 list-none px-4 py-3 text-sm font-semibold text-fg">
          If it does not boot
        </summary>
        <ul className="flex flex-col gap-3 border-t border-line px-4 py-4">
          {TROUBLES.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-semibold text-fg">{item.title}</p>
              <p className="text-sm text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Choice(props: {
  pressed: boolean;
  title: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      onClick={props.onClick}
      className={
        "min-h-11 rounded-panel px-3 py-3 text-left shadow-plate transition-colors duration-200 " +
        (props.pressed ? "bg-volt text-ink" : "bg-surface text-fg")
      }
    >
      <span className="block text-sm font-semibold">{props.title}</span>
      {props.hint ? (
        <span className={"mt-1 block text-xs " + (props.pressed ? "text-ink" : "text-muted")}>
          {props.hint}
        </span>
      ) : null}
    </button>
  );
}

function SwitchRow(props: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-panel bg-surface px-4 py-3 text-left shadow-plate"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{props.label}</span>
        <span className="block text-xs text-muted">{props.detail}</span>
      </span>
      <span
        className={
          "flex h-7 w-12 shrink-0 items-center rounded-full p-1 " +
          (props.checked ? "bg-volt" : "bg-surface-2")
        }
        aria-hidden="true"
      >
        <span className={"size-5 rounded-full " + (props.checked ? "ml-auto bg-ink" : "bg-muted")} />
      </span>
    </button>
  );
}

function Fact(props: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-panel bg-surface p-4 shadow-plate">
      <span className="text-volt" aria-hidden="true">
        {props.icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-fg">{props.title}</h3>
      <p className="mt-1 text-sm text-muted">{props.body}</p>
    </div>
  );
}

function Row(props: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2 first:border-t-0">
      <dt className="shrink-0 text-xs text-muted">{props.k}</dt>
      <dd className="min-w-0 break-all text-right font-mono text-xs text-fg">{props.v}</dd>
    </div>
  );
}

function ScriptBlock(props: { title: string; body: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="overflow-hidden rounded-panel bg-surface shadow-plate">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h3 className="text-sm font-semibold text-fg">{props.title}</h3>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(props.body).then(
              () => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              },
              () => setCopied(false),
            );
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-volt"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto px-3 py-3 font-mono text-xs leading-relaxed text-soft">
        {props.body}
      </pre>
    </div>
  );
}
