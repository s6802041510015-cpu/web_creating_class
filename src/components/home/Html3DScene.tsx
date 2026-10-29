import "./html-3d-scene.css";

export function Html3DScene() {
  return (
    <div
      className="html-3d"
      role="img"
      aria-label="ภาพสามมิติของหน้าเว็บไซต์ที่ประกอบจากแท็ก HTML"
    >
      <div className="html-3d__orbit" />
      <div className="html-3d__rig">
        <div className="html-3d__backplate" />
        <div className="html-3d__middleplate" />
        <div className="html-3d__browser">
          <div className="html-3d__toolbar">
            <span className="html-3d__lights"><i /><i /><i /></span>
            <span className="html-3d__address">my-first-website.html</span>
            <span className="html-3d__toolbar-mark">✦</span>
          </div>
          <div className="html-3d__page">
            <div className="html-3d__page-top">
              <span className="html-3d__logo">W<span>Q</span></span>
              <span className="html-3d__nav-lines"><i /><i /><i /></span>
            </div>
            <div className="html-3d__page-body">
              <span className="html-3d__eyebrow">HELLO, WORLD!</span>
              <strong>เว็บแรกของฉัน</strong>
              <span className="html-3d__text-line" />
              <span className="html-3d__text-line html-3d__text-line--short" />
              <span className="html-3d__page-button">เริ่มสำรวจ →</span>
            </div>
            <div className="html-3d__page-art">
              <span className="html-3d__art-back" />
              <span className="html-3d__art-front" />
              <span className="html-3d__art-sun" />
            </div>
          </div>
        </div>
        <span className="html-3d__tag html-3d__tag--html">&lt;html&gt;</span>
        <span className="html-3d__tag html-3d__tag--body">&lt;body&gt;</span>
        <span className="html-3d__tag html-3d__tag--heading">&lt;h1&gt;</span>
        <span className="html-3d__spark html-3d__spark--one">✦</span>
        <span className="html-3d__spark html-3d__spark--two">✧</span>
      </div>
      <span className="html-3d__caption">HTML → หน้าเว็บที่มองเห็นได้</span>
    </div>
  );
}
