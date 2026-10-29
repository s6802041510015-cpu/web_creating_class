import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import "./cell-3d.css";

type PartId = "nucleus" | "mitochondria" | "er" | "golgi" | "ribosomes";

const PARTS: {
  id: PartId;
  number: string;
  name: string;
  english: string;
  color: string;
  description: string;
  fact: string;
}[] = [
  {
    id: "nucleus",
    number: "01",
    name: "นิวเคลียส",
    english: "NUCLEUS",
    color: "#a79cff",
    description: "ศูนย์ควบคุมของเซลล์ เก็บสารพันธุกรรม DNA และกำกับการทำงานส่วนต่าง ๆ",
    fact: "ลองนึกว่าเป็นห้องสมุดที่เก็บคู่มือการสร้างและดูแลเซลล์",
  },
  {
    id: "mitochondria",
    number: "02",
    name: "ไมโทคอนเดรีย",
    english: "MITOCHONDRIA",
    color: "#ff9a7b",
    description: "เปลี่ยนพลังงานจากอาหารให้เป็น ATP ที่เซลล์นำไปใช้ทำงาน",
    fact: "เซลล์ที่ใช้พลังงานมากมักมีไมโทคอนเดรียจำนวนมาก",
  },
  {
    id: "er",
    number: "03",
    name: "ร่างแหเอนโดพลาซึม",
    english: "ENDOPLASMIC RETICULUM",
    color: "#5ee0d5",
    description: "เครือข่ายเยื่อภายในเซลล์ ช่วยสร้างและลำเลียงโปรตีนกับไขมัน",
    fact: "ชนิดขรุขระมีไรโบโซมเกาะอยู่ ส่วนชนิดเรียบไม่มี",
  },
  {
    id: "golgi",
    number: "04",
    name: "กอลจิบอดี",
    english: "GOLGI APPARATUS",
    color: "#f2c67a",
    description: "ปรับแต่ง คัดแยก และบรรจุสารเพื่อส่งไปยังจุดหมายในเซลล์หรือออกนอกเซลล์",
    fact: "เปรียบได้กับศูนย์คัดแยกพัสดุของเซลล์",
  },
  {
    id: "ribosomes",
    number: "05",
    name: "ไรโบโซม",
    english: "RIBOSOMES",
    color: "#a8dbff",
    description: "โครงสร้างขนาดเล็กที่อ่านคำสั่งจาก RNA เพื่อประกอบโปรตีน",
    fact: "พบได้ทั้งลอยในไซโทพลาซึมและเกาะบนร่างแหเอนโดพลาซึม",
  },
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function CellScene({
  selected,
  onSelect,
  autoRotate,
  showMembrane,
  resetView,
}: {
  selected: PartId;
  onSelect: (part: PartId) => void;
  autoRotate: boolean;
  showMembrane: boolean;
  resetView: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    controls: OrbitControls;
    membrane: THREE.Object3D;
    halo: THREE.Mesh;
    groups: Record<PartId, THREE.Group>;
  } | null>(null);
  const onSelectRef = useRef(onSelect);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setRenderError(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.65;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0.15, 0.2, 8.9);

    scene.add(new THREE.AmbientLight(0x9db8db, 2.2));
    const key = new THREE.PointLight(0x91e9e8, 75);
    key.position.set(-3.5, 3.5, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0xaa7afa, 110);
    rim.position.set(2.5, -1, -3);
    scene.add(rim);
    const warm = new THREE.PointLight(0xffb87b, 35);
    warm.position.set(4, 2, 3);
    scene.add(warm);

    const cell = new THREE.Group();
    scene.add(cell);
    const sphere = (radius: number, color: number, opacity = 1) =>
      new THREE.Mesh(
        new THREE.SphereGeometry(radius, 40, 28),
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.28,
          metalness: 0.04,
          transparent: opacity < 1,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: opacity === 1,
        }),
      );

    const cytoplasm = sphere(2.12, 0x4bc5c6, 0.055);
    cell.add(cytoplasm);
    const membrane = new THREE.Group();
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(2.17, 64, 40),
      new THREE.MeshPhysicalMaterial({
        color: 0x66d7d0,
        transmission: 0.35,
        transparent: true,
        opacity: 0.18,
        roughness: 0.18,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    membrane.add(shell);
    const outline = new THREE.Mesh(
      new THREE.TorusGeometry(2.17, 0.014, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0x8feee4, transparent: true, opacity: 0.52 }),
    );
    outline.rotation.x = 0.22;
    outline.rotation.y = -0.34;
    membrane.add(outline);
    cell.add(membrane);

    const groups = {} as Record<PartId, THREE.Group>;
    const pickables: THREE.Object3D[] = [];
    const register = (id: PartId, group: THREE.Group) => {
      groups[id] = group;
      cell.add(group);
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.userData.partId = id;
          pickables.push(object);
        }
      });
    };

    const nucleus = new THREE.Group();
    nucleus.position.set(0.13, 0.14, 0.12);
    const nucleusBody = sphere(0.76, 0x8178cf, 0.92);
    nucleus.add(nucleusBody);
    const nucleusInner = sphere(0.53, 0x5b55ac, 0.36);
    nucleus.add(nucleusInner);
    const nucleolus = sphere(0.23, 0xd9a9ed, 0.95);
    nucleolus.position.set(0.17, -0.11, 0.48);
    nucleus.add(nucleolus);
    const nucleusRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.77, 0.025, 10, 90),
      new THREE.MeshBasicMaterial({ color: 0xbfb6ff, transparent: true, opacity: 0.58 }),
    );
    nucleusRing.rotation.set(0.28, -0.38, 0.18);
    nucleus.add(nucleusRing);
    register("nucleus", nucleus);

    const mitochondria = new THREE.Group();
    const makeMito = (x: number, y: number, z: number, rotation: number, scale: number) => {
      const mito = new THREE.Group();
      mito.position.set(x, y, z);
      mito.rotation.z = rotation;
      mito.scale.setScalar(scale);
      const body = sphere(0.44, 0xeb785f, 0.95);
      body.scale.set(1.55, 0.66, 0.7);
      mito.add(body);
      const inner = sphere(0.38, 0xffaa7c, 0.35);
      inner.scale.set(1.5, 0.55, 0.6);
      mito.add(inner);
      for (let i = -2; i <= 2; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(i * 0.19 - 0.12, -0.17, 0.22),
          new THREE.Vector3(i * 0.19, -0.06, 0.3),
          new THREE.Vector3(i * 0.19 - 0.07, 0.07, 0.3),
          new THREE.Vector3(i * 0.19 + 0.04, 0.17, 0.22),
        ]);
        mito.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(curve, 20, 0.018, 5, false),
            new THREE.MeshBasicMaterial({ color: 0xffd2a2 }),
          ),
        );
      }
      mitochondria.add(mito);
    };
    makeMito(1.13, 0.82, 0.52, -0.7, 1);
    makeMito(-1.17, -0.72, 0.55, 0.45, 0.8);
    makeMito(0.95, -1.13, -0.3, 0.9, 0.65);
    register("mitochondria", mitochondria);

    const er = new THREE.Group();
    for (let layer = 0; layer < 7; layer++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= 32; j++) {
        const t = j / 32;
        points.push(
          new THREE.Vector3(
            -1.67 + t * 1.07,
            0.98 - layer * 0.21 + Math.sin(t * 13 + layer * 0.52) * 0.08,
            -0.12 + layer * 0.055,
          ),
        );
      }
      er.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 45, 0.055, 7, false),
          new THREE.MeshPhysicalMaterial({ color: 0x43c8bd, roughness: 0.3, metalness: 0.16 }),
        ),
      );
    }
    register("er", er);

    const golgi = new THREE.Group();
    golgi.position.set(-0.95, -1.15, 0.47);
    for (let i = 0; i < 6; i++) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.54 - i * 0.045, 0.055, 7, 56, Math.PI * 1.28),
        new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0xe4a963 : 0xf5ca84, roughness: 0.42 }),
      );
      arc.position.y = i * 0.13 - 0.35;
      arc.rotation.set(0.08, 0.1, -0.12);
      golgi.add(arc);
    }
    register("golgi", golgi);

    const ribosomes = new THREE.Group();
    const random = seededRandom(28);
    for (let i = 0; i < 80; i++) {
      const angle = random() * Math.PI * 2;
      const r = 0.15 + random() * 0.55;
      const dot = sphere(0.018 + random() * 0.018, i % 5 ? 0xa6d9fa : 0xe6f7ff);
      dot.position.set(1.05 + Math.cos(angle) * r, -0.15 + Math.sin(angle) * r, 0.15 + random() * 0.8);
      ribosomes.add(dot);
    }
    register("ribosomes", ribosomes);

    const specks: number[] = [];
    for (let i = 0; i < 160; i++) {
      const theta = random() * Math.PI * 2;
      const u = random() * 2 - 1;
      const r = Math.cbrt(random()) * 1.96;
      specks.push(r * Math.sqrt(1 - u * u) * Math.cos(theta), r * u, r * Math.sqrt(1 - u * u) * Math.sin(theta));
    }
    const speckGeometry = new THREE.BufferGeometry();
    speckGeometry.setAttribute("position", new THREE.Float32BufferAttribute(specks, 3));
    cell.add(
      new THREE.Points(
        speckGeometry,
        new THREE.PointsMaterial({ color: 0xc5f7ee, size: 0.019, transparent: true, opacity: 0.72 }),
      ),
    );

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.91, 0.012, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthTest: false }),
    );
    halo.renderOrder = 20;
    scene.add(halo);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 5.2;
    controls.maxDistance = 14;
    controls.autoRotateSpeed = 0.7;
    sceneRef.current = { controls, membrane, halo, groups };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      if (hit?.object.userData.partId) onSelectRef.current(hit.object.userData.partId as PartId);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      nucleusRing.rotation.z = elapsed * 0.08;
      halo.lookAt(camera.position);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.42 + Math.sin(elapsed * 2.5) * 0.18;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    const group = current.groups[selected];
    const center = new THREE.Vector3();
    group.getWorldPosition(center);
    if (selected === "mitochondria") center.set(1.13, 0.82, 0.52);
    if (selected === "ribosomes") center.set(1.05, -0.15, 0.5);
    if (selected === "er") center.set(-1.12, 0.25, 0.18);
    current.halo.position.copy(center);
    current.halo.scale.setScalar(selected === "nucleus" ? 1 : selected === "er" ? 0.8 : 0.55);
    (current.halo.material as THREE.MeshBasicMaterial).color.set(PARTS.find((part) => part.id === selected)?.color || "#ffffff");
  }, [selected]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.membrane.visible = showMembrane;
  }, [showMembrane]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { controls } = sceneRef.current;
    controls.object.position.set(0.15, 0.2, 8.9);
    controls.target.set(0, 0, 0);
    controls.update();
  }, [resetView]);

  return (
    <div className="cell-scene" ref={mountRef} aria-label="โมเดลเซลล์สัตว์สามมิติ หมุนและซูมเพื่อสำรวจ">
      {renderError && <div className="cell-render-error">เบราว์เซอร์นี้ไม่รองรับการแสดงผล 3D ผ่าน WebGL</div>}
    </div>
  );
}

export function Cell3DDemoPage() {
  const [selected, setSelected] = useState<PartId>("nucleus");
  const [visited, setVisited] = useState<PartId[]>(["nucleus"]);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showMembrane, setShowMembrane] = useState(true);
  const [resetView, setResetView] = useState(0);
  const active = PARTS.find((part) => part.id === selected)!;

  useEffect(() => {
    const previous = document.title;
    document.title = "Microworld — สำรวจเซลล์ 3D";
    return () => { document.title = previous; };
  }, []);

  const selectPart = (part: PartId) => {
    setSelected(part);
    setVisited((old) => (old.includes(part) ? old : [...old, part]));
    setAutoRotate(false);
  };
  const nextPart = () => {
    const index = PARTS.findIndex((part) => part.id === selected);
    selectPart(PARTS[(index + 1) % PARTS.length].id);
  };

  return (
    <div className="cell-page">
      <div className="cell-ambient cell-ambient--one" />
      <div className="cell-ambient cell-ambient--two" />
      <header className="cell-header">
        <div className="cell-brand"><span className="cell-brand__mark">✳</span><span>micro<span>world</span><small>INTERACTIVE SCIENCE LAB</small></span></div>
        <div className="cell-header__actions">
          <ThemeToggle compact />
          <Link to="/" className="cell-back"><ArrowLeft size={17} /> กลับสู่เว็บหลัก</Link>
        </div>
      </header>

      <main className="cell-main">
        <div className="cell-eyebrow"><span className="cell-eyebrow__line" /> BIOLOGY / 001 <span className="cell-eyebrow__dot" /> บทเรียนทดลอง</div>
        <div className="cell-intro">
          <div>
            <h1>โลกเล็ก ๆ <em>ในหนึ่งเซลล์</em></h1>
            <p>ลองหมุน สำรวจ และแตะส่วนประกอบของเซลล์สัตว์ เพื่อค้นพบว่าชีวิตเริ่มต้นจากอะไร</p>
          </div>
          <div className="cell-intro__badge"><span>3D</span><small>INTERACTIVE<br />EXPERIENCE</small></div>
        </div>

        <div className="cell-workspace">
          <section className="cell-viewer" aria-label="สำรวจโมเดลเซลล์สามมิติ">
            <div className="cell-viewer__top"><span className="cell-live"><i /> LIVE MODEL</span><span className="cell-viewer__type">ANIMAL CELL <span>/</span> 01</span></div>
            <CellScene selected={selected} onSelect={selectPart} autoRotate={autoRotate} showMembrane={showMembrane} resetView={resetView} />
            <div className="cell-viewer__glow" />
            <div className="cell-viewer__bottom">
              <span className="cell-viewer__hint"><MousePointer2 size={17} /> ลากเพื่อหมุน <span>·</span> เลื่อนเพื่อซูม <span>·</span> คลิกเพื่อสำรวจ</span>
              <div className="cell-controls">
                <button type="button" title={autoRotate ? "หยุดหมุน" : "หมุนอัตโนมัติ"} onClick={() => setAutoRotate((value) => !value)}>{autoRotate ? <Pause size={17} /> : <Play size={17} />}</button>
                <button type="button" title={showMembrane ? "ซ่อนเยื่อหุ้มเซลล์" : "แสดงเยื่อหุ้มเซลล์"} onClick={() => setShowMembrane((value) => !value)}>{showMembrane ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                <button type="button" title="กลับไปมุมเริ่มต้น" onClick={() => setResetView((value) => value + 1)}><RotateCcw size={17} /></button>
              </div>
            </div>
          </section>

          <aside className="cell-info">
            <div className="cell-info__header"><span>คู่มือสำรวจ</span><span>{String(visited.length).padStart(2, "0")} / 05 DISCOVERED</span></div>
            <div className="cell-progress" aria-label={`สำรวจแล้ว ${visited.length} จาก 5 ส่วน`}><span style={{ width: `${visited.length * 20}%` }} /></div>
            <p className="cell-info__helper">เลือกส่วนประกอบเพื่อเรียนรู้หน้าที่</p>
            <div className="cell-part-list">
              {PARTS.map((part) => (
                <button key={part.id} type="button" className={`cell-part ${selected === part.id ? "is-active" : ""}`} onClick={() => selectPart(part.id)}>
                  <span className="cell-part__number">{part.number}</span>
                  <span className="cell-part__dot" style={{ background: part.color, boxShadow: `0 0 15px ${part.color}80` }} />
                  <span className="cell-part__name">{part.name}<small>{part.english}</small></span>
                  <ArrowRight size={16} className="cell-part__arrow" />
                </button>
              ))}
            </div>

            <div className="cell-detail" style={{ "--part-color": active.color } as React.CSSProperties}>
              <div className="cell-detail__eyebrow"><Sparkles size={15} /> กำลังสำรวจ · {active.number}</div>
              <h2>{active.name}</h2>
              <p>{active.description}</p>
              <div className="cell-detail__fact"><span>รู้หรือไม่?</span>{active.fact}</div>
              <button type="button" className="cell-next" onClick={nextPart}>สำรวจส่วนถัดไป <ArrowRight size={17} /></button>
            </div>
          </aside>
        </div>
        <div className="cell-footer"><span>✳ <strong>MICROWORLD</strong> / CELL EXPLORER</span><span>ต้นแบบสื่อการเรียนรู้ 3D · เซลล์สัตว์</span></div>
      </main>
    </div>
  );
}
