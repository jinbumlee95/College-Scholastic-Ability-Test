import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  makeModel,
  mix,
  type Model,
  type SceneId,
  type Point,
} from "../visuals/models";
import { questionBounds } from "../visuals/question-scenes";

function disposeGroup(group: THREE.Group) {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh instanceof THREE.InstancedMesh) mesh.dispose();
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const list = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      list.forEach((x) => x.dispose());
    }
  });
  group.clear();
}
function StaticPlot({ model }: { model: Model }) {
  const [xmin, xmax, ymin, ymax] = model.range,
    w = 700,
    h = 400;
  const xy = (p: Point) =>
    `${((p[0] - xmin) / (xmax - xmin)) * w},${h - ((p[1] - ymin) / (ymax - ymin)) * h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={model.description}
      className="fallback-plot"
    >
      {model.surfaces.map((s, i) => (
        <polygon
          key={"p" + i}
          points={s.points.map(xy).join(" ")}
          fill={s.color}
          opacity={s.opacity}
        />
      ))}
      <path
        d={`M${xy([xmin, 0, 0])} L${xy([xmax, 0, 0])} M${xy([0, ymin, 0])} L${xy([0, ymax, 0])}`}
        stroke="#a8a29e"
        strokeWidth="1"
      />
      {model.lines.map((l, i) => (
        <polyline
          key={i}
          points={l.points.map(xy).join(" ")}
          stroke={l.color}
          fill="none"
          opacity={l.opacity ?? 1}
          strokeWidth="3"
          strokeDasharray={l.dashed ? "5 5" : undefined}
        />
      ))}
      {model.dots.map((d, i) => {
        const [x, y] = xy(d.at).split(",");
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill={d.open ? "var(--surface)" : d.color}
            stroke={d.color}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
export default function MathScene({
  id,
  parameters,
  step,
  resetKey = 0,
  compact = false,
}: {
  id: SceneId;
  parameters: Record<string, number>;
  step: number;
  resetKey?: number;
  compact?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.OrthographicCamera;
      controls: OrbitControls;
      group: THREE.Group;
      textures: Map<string, THREE.CanvasTexture>;
      draw: (m: Model) => void;
      fit: () => void;
    } | null>(null);
  const progress = useRef(step),
    lastId = useRef(id),
    lastStep = useRef(step),
    frame = useRef(0),
    [failed, setFailed] = useState(false),
    [dark, setDark] = useState(false);
  const finalModel = makeModel(id, parameters, step),
    threeD = finalModel.threeD;
  const bounds = useMemo(() => questionBounds(id), [id]);
  useEffect(() => {
    const update = () =>
      setDark(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim() === "#0c0a09",
      );
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const media = matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (!host.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(
        -5,
        5,
        4,
        -4,
        0.01,
        Math.max(100, (bounds?.radius ?? 5) * 20),
      ),
      group = new THREE.Group(),
      textures = new Map<string, THREE.CanvasTexture>();
    scene.add(group);
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute(
      "aria-label",
      threeD
        ? "풀이 단계에 따라 변하는 공간 도형. 드래그로 회전합니다."
        : "풀이 단계에 따라 변하는 좌표평면 그래프. 아래 조작부로 조건을 바꿀 수 있습니다.",
    );
    host.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = threeD;
    controls.enablePan = true;
    controls.enableZoom = true;
    if (!threeD) {
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.PAN;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    }
    controls.minZoom = 0.65;
    controls.maxZoom = 8;
    controls.target.set(
      ...(threeD && bounds
        ? bounds.center
        : ([threeD ? 1.6 : 0, threeD ? 1 : 0, 0] as Point)),
    );
    const position = () => {
      camera.up.set(0, threeD ? 0 : 1, threeD ? 1 : 0);
      camera.position.set(threeD ? 7 : 0, threeD ? -9 : 0, threeD ? 8 : 20);
      if (threeD && bounds)
        camera.position
          .copy(controls.target)
          .add(
            new THREE.Vector3(7, -9, 8)
              .normalize()
              .multiplyScalar(bounds.radius * 3),
          );
      camera.lookAt(controls.target);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      controls.update();
    };
    position();
    let current: Model | undefined;
    const render = () => renderer.render(scene, camera);
    const fit = () => {
      if (!host.current) return;
      const width = host.current.clientWidth,
        height = host.current.clientHeight || 400;
      renderer.setSize(width, height, false);
      const aspect = width / height;
      if (threeD) {
        const half = bounds
          ? (bounds.radius * 1.15) / Math.min(1, aspect)
          : 5.3;
        camera.left = -half * aspect;
        camera.right = half * aspect;
        camera.top = half;
        camera.bottom = -half;
      } else if (current) {
        const [xmin, xmax, ymin, ymax] = current.range,
          cx = (xmin + xmax) / 2,
          cy = (ymin + ymax) / 2;
        let dx = (xmax - xmin) / 2,
          dy = (ymax - ymin) / 2;
        if (current.equalAspect || ["conic", "vector"].includes(id)) {
          if (dx / dy < aspect) dx = dy * aspect;
          else dy = dx / aspect;
        }
        camera.left = cx - dx;
        camera.right = cx + dx;
        camera.top = cy + dy;
        camera.bottom = cy - dy;
      }
      camera.updateProjectionMatrix();
      render();
    };
    const horizontalScale = () => {
      if (
        threeD ||
        !current ||
        !host.current ||
        current.equalAspect ||
        ["conic", "vector"].includes(id)
      )
        return 1;
      return (
        (current.range[1] - current.range[0]) /
        (current.range[3] - current.range[2]) /
        (host.current.clientWidth / host.current.clientHeight)
      );
    };
    const stroke = (
      points: Point[],
      color: string,
      opacity = 1,
      dashed = false,
      width = 0.022,
    ) => {
      if (points.length < 2 || opacity < 0.01) return;
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(...p)),
      );
      const material = dashed
        ? new THREE.LineDashedMaterial({
            color,
            transparent: true,
            opacity,
            dashSize: 0.1,
            gapSize: 0.07,
          })
        : new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            linewidth: width,
          });
      const object = new THREE.Line(geometry, material);
      object.computeLineDistances();
      group.add(object);
    };
    const label = (text: string, p: Point, scale = 0.6) => {
      const key = text + dark;
      let texture = textures.get(key);
      if (!texture) {
        const c = document.createElement("canvas");
        c.width = 384;
        c.height = 80;
        const ctx = c.getContext("2d")!;
        ctx.font = '30px "Pretendard Variable", sans-serif';
        ctx.fillStyle = dark ? "#e7e5e4" : "#57534e";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(text, 192, 40, 365);
        texture = new THREE.CanvasTexture(c);
        textures.set(key, texture);
      }
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          depthTest: false,
          transparent: true,
        }),
      );
      sprite.position.set(...p);
      sprite.scale.set(scale * 4.8 * horizontalScale(), scale, 1);
      group.add(sprite);
    };
    const draw = (model: Model) => {
      current = model;
      disposeGroup(group);
      const [xmin, xmax, ymin, ymax] = model.range;
      const grid = dark ? "#3b3530" : "#e7e5e4",
        ink = dark ? "#a8a29e" : "#a8a29e";
      if (!threeD) {
        const tickSize = (span: number) => {
          const power = 10 ** Math.floor(Math.log10(span / 8)),
            m = span / 8 / power;
          return power * (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10);
        };
        const dx = tickSize(xmax - xmin),
          dy = tickSize(ymax - ymin);
        const labelUnit = (ymax - ymin) / 8;
        for (
          let x = Math.ceil(xmin / dx) * dx;
          x <= xmax + dx * 0.01;
          x += dx
        ) {
          stroke(
            [
              [x, ymin, 0],
              [x, ymax, 0],
            ],
            grid,
            0.65,
          );
          if (Math.abs(x) > 0.01 && !(model.symbolicX && x > 0))
            label(
              Number(x.toPrecision(5)).toString(),
              [
                x,
                Math.max(
                  ymin + 0.35 * labelUnit,
                  Math.min(ymax - 0.35 * labelUnit, -0.3 * labelUnit),
                ),
                0.01,
              ],
              0.48 * labelUnit,
            );
        }
        for (
          let y = Math.ceil(ymin / dy) * dy;
          y <= ymax + dy * 0.01;
          y += dy
        ) {
          stroke(
            [
              [xmin, y, 0],
              [xmax, y, 0],
            ],
            grid,
            0.65,
          );
          if (Math.abs(y) > 0.01)
            label(
              Number(y.toPrecision(5)).toString(),
              [
                Math.max(
                  xmin + (xmax - xmin) * 0.04,
                  Math.min(
                    xmax - (xmax - xmin) * 0.04,
                    -0.35 * labelUnit * horizontalScale(),
                  ),
                ),
                y,
                0.01,
              ],
              0.48 * labelUnit,
            );
        }
        stroke(
          [
            [xmin, 0, 0.01],
            [xmax, 0, 0.01],
          ],
          ink,
        );
        stroke(
          [
            [0, ymin, 0.01],
            [0, ymax, 0.01],
          ],
          ink,
        );
        label(
          id === "integral" && progress.current >= 3 ? "u" : "x",
          [xmax - 0.08 * (xmax - xmin), -0.55 * labelUnit, 0.01],
          0.6 * labelUnit,
        );
        if (model.axisLabel)
          label(
            model.axisLabel,
            [xmin + (xmax - xmin) * 0.15, ymax - 0.3 * labelUnit, 0.01],
            0.55 * labelUnit,
          );
      } else {
        for (let x = -5; x <= 5; x++)
          stroke(
            [
              [x, -1, 0],
              [x, 4, 0],
            ],
            grid,
            0.6,
          );
        for (let y = -1; y <= 4; y++)
          stroke(
            [
              [-5, y, 0],
              [5, y, 0],
            ],
            grid,
            0.6,
          );
        stroke(
          [
            [-5, 0, 0],
            [5, 0, 0],
          ],
          ink,
        );
        stroke(
          [
            [0, -1, 0],
            [0, 4, 0],
          ],
          ink,
        );
        stroke(
          [
            [0, 0, 0],
            [0, 0, 3.5],
          ],
          ink,
        );
        label("x", [5.15, 0, 0]);
        label("y", [0, 4.15, 0]);
        label("z", [0, 0, 3.65]);
      }
      model.surfaces.forEach((s) => {
        if (s.points.length < 3) return;
        const vertices: number[] = [];
        if (s.triangulation === "strip-to-axis") {
          for (let i = 1; i < s.points.length - 2; i++) {
            const a = s.points[i],
              b = s.points[i + 1];
            vertices.push(
              a[0],
              0,
              a[2],
              ...a,
              ...b,
              a[0],
              0,
              a[2],
              ...b,
              b[0],
              0,
              b[2],
            );
          }
        } else {
          const origin = new THREE.Vector3(...s.points[0]);
          const u = new THREE.Vector3(),
            normal = new THREE.Vector3();
          for (let i = 1; i < s.points.length; i++) {
            u.set(...s.points[i]).sub(origin);
            if (u.lengthSq() > 1e-14) break;
          }
          for (let i = 2; i < s.points.length; i++) {
            normal.crossVectors(
              u,
              new THREE.Vector3(...s.points[i]).sub(origin),
            );
            if (normal.lengthSq() > 1e-14) break;
          }
          if (normal.lengthSq() > 1e-14) {
            u.normalize();
            normal.normalize();
            const v = new THREE.Vector3().crossVectors(normal, u);
            const contour = s.points.map((pt) => {
              const d = new THREE.Vector3(...pt).sub(origin);
              return new THREE.Vector2(d.dot(u), d.dot(v));
            });
            for (const face of THREE.ShapeUtils.triangulateShape(contour, []))
              for (const index of face) vertices.push(...s.points[index]);
          }
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
        const mesh = new THREE.Mesh(
          geom,
          new THREE.MeshBasicMaterial({
            color: s.color,
            transparent: true,
            opacity: s.opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        mesh.renderOrder = -1;
        group.add(mesh);
      });
      model.lines.forEach((l) =>
        stroke(l.points, l.color, l.opacity ?? 1, l.dashed, l.width),
      );
      const aspect = host.current
        ? host.current.clientWidth / (host.current.clientHeight || 400)
        : 1.75;
      const sameScale = model.equalAspect || ["conic", "vector"].includes(id);
      const unit = threeD
        ? bounds
          ? bounds.radius / 5
          : 1
        : (sameScale
            ? Math.max(ymax - ymin, (xmax - xmin) / aspect)
            : ymax - ymin) / 7;
      const closedGroups = new Map<string, typeof model.dots>();
      for (const d of model.dots) {
        if (d.open) continue;
        const key = `${d.color}/${d.opacity ?? 1}`;
        const list = closedGroups.get(key) || [];
        list.push(d);
        closedGroups.set(key, list);
      }
      for (const ds of closedGroups.values()) {
        const geometry = threeD
          ? new THREE.SphereGeometry(1, 10, 6)
          : new THREE.CircleGeometry(1, 16);
        const material = new THREE.MeshBasicMaterial({
          color: ds[0].color,
          side: THREE.DoubleSide,
          depthTest: false,
          transparent: true,
          opacity: ds[0].opacity ?? 1,
        });
        const mesh = new THREE.InstancedMesh(geometry, material, ds.length),
          matrix = new THREE.Matrix4(),
          quaternion = new THREE.Quaternion();
        ds.forEach((d, i) => {
          const r = (d.size ?? 0.065) * unit;
          matrix.compose(
            new THREE.Vector3(d.at[0], d.at[1], d.at[2] + 0.02),
            quaternion,
            new THREE.Vector3(r * horizontalScale(), r, r),
          );
          mesh.setMatrixAt(i, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.renderOrder = 3;
        group.add(mesh);
      }
      model.dots.forEach((d) => {
        if (!d.open) {
          if (d.label && (d.opacity ?? 1) > 0.5)
            label(
              d.label,
              [d.at[0], d.at[1] + 0.34 * unit, d.at[2] + 0.06],
              0.5 * unit,
            );
          return;
        }
        const radius = (d.size ?? 0.065) * unit;
        const geom = d.open
          ? new THREE.RingGeometry(radius * 0.65, radius, 28)
          : threeD
            ? new THREE.SphereGeometry(radius, 12, 8)
            : new THREE.CircleGeometry(radius, 20);
        const mat = new THREE.MeshBasicMaterial({
          color: d.color,
          side: THREE.DoubleSide,
          depthTest: false,
          transparent: true,
          opacity: d.opacity ?? 1,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(...d.at);
        mesh.position.z += 0.02;
        mesh.scale.x = horizontalScale();
        mesh.renderOrder = 3;
        group.add(mesh);
        if (d.open) {
          const hole = new THREE.Mesh(
            new THREE.CircleGeometry(radius * 0.65, 24),
            new THREE.MeshBasicMaterial({
              color: dark ? "#1c1917" : "#ffffff",
              depthTest: false,
              transparent: true,
              opacity: d.opacity ?? 1,
            }),
          );
          hole.position.copy(mesh.position);
          hole.scale.x = horizontalScale();
          hole.renderOrder = 2;
          group.add(hole);
        }
        if (d.label && (d.opacity ?? 1) > 0.5)
          label(
            d.label,
            [d.at[0], d.at[1] + 0.34 * unit, d.at[2] + 0.06],
            0.5 * unit,
          );
      });
      fit();
      render();
    };
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(fit);
    observer.observe(host.current);
    engine.current = {
      renderer,
      scene,
      camera,
      controls,
      group,
      textures,
      draw,
      fit,
    };
    const loss = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", loss);
    return () => {
      cancelAnimationFrame(frame.current);
      observer.disconnect();
      controls.dispose();
      disposeGroup(group);
      textures.forEach((t) => t.dispose());
      renderer.domElement.removeEventListener("webglcontextlost", loss);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      engine.current = null;
    };
  }, [threeD, dark, resetKey]);
  useEffect(() => {
    const api = engine.current;
    if (!api) return;
    cancelAnimationFrame(frame.current);
    if (lastId.current !== id) {
      progress.current = step;
      lastId.current = id;
    }
    const from = progress.current,
      to = step,
      start = performance.now(),
      duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 750;
    const cameraStart = api.camera.position.clone();
    const topView =
      (id === "projection" && step === 3) || (id === "incircle" && step === 5);
    const cameraTarget = bounds
      ? new THREE.Vector3(...bounds.center).add(
          new THREE.Vector3(7, -9, 8)
            .normalize()
            .multiplyScalar(bounds.radius * 3),
        )
      : topView
        ? new THREE.Vector3(1.6, -2, 14)
        : id === "incircle" && step === 3
          ? new THREE.Vector3(12, -10, 5)
          : new THREE.Vector3(7, -9, 8);
    const changeView = threeD && lastStep.current !== step;
    lastStep.current = step;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration),
        smooth = t * t * (3 - 2 * t);
      progress.current = mix(from, to, smooth);
      if (changeView) {
        api.camera.position.lerpVectors(cameraStart, cameraTarget, smooth);
        api.camera.lookAt(api.controls.target);
      }
      api.draw(makeModel(id, parameters, progress.current));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [id, parameters, step, threeD, dark, resetKey]);
  return (
    <div className={`math-scene ${compact ? "compact" : ""}`}>
      <div ref={host} className="canvas-host" />
      {failed && (
        <>
          <StaticPlot model={finalModel} />
          <div className="fallback-notice" role="status">
            WebGL을 사용할 수 없어 평면 투영으로 표시합니다. 수식과 값은 그대로
            확인할 수 있습니다.
          </div>
        </>
      )}
      <span className="scene-hint">
        {threeD
          ? "드래그 · 회전 / 스크롤 · 확대"
          : "드래그 · 이동 / 스크롤 · 확대"}
      </span>
      <p className="sr-only">{finalModel.description}</p>
    </div>
  );
}
