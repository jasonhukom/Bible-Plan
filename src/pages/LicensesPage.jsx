import { Link } from "react-router-dom";

export default function LicensesPage() {
  return (
    <div className="page-shell">
      <div className="page-header page-header-sticky">
        <div className="page-header-title-row">
          <h1 className="page-title">Licenses</h1>
          <p className="page-subtitle">Copyright and translation permissions</p>
        </div>
        <div className="page-header-actions">
        </div>
      </div>

      <div className="page-container-narrow" style={{ paddingBottom: 80 }}>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Bible Translations</h2>
        <p className="hint-text" style={{ marginBottom: 16 }}>
          This application utilizes several Bible translations. Some are in the public domain, while others are copyrighted and used by permission.
        </p>

        <h3 style={{ fontSize: 15, marginBottom: 8, color: "var(--gold-bright)" }}>New International Version (NIV)</h3>
        <p className="hint-text" style={{ marginBottom: 20 }}>
          Scripture quotations marked (NIV) are taken from the Holy Bible, New International Version®, NIV®. 
          Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ 
          Used by permission of Zondervan. All rights reserved worldwide. 
          The "NIV" and "New International Version" are trademarks registered in the United States Patent and Trademark Office by Biblica, Inc.™
        </p>

        <h3 style={{ fontSize: 15, marginBottom: 8, color: "var(--gold-bright)" }}>Berean Standard Bible (BSB)</h3>
        <p className="hint-text" style={{ marginBottom: 20 }}>
          The Holy Bible, Berean Standard Bible, BSB is produced in cooperation with Bible Hub, Discovery Bible, OpenBible.com, and the Berean Bible Translation Committee. This text of the Berean Standard Bible is released to the public domain.
        </p>

        <h3 style={{ fontSize: 15, marginBottom: 8, color: "var(--gold-bright)" }}>Other Translations</h3>
        <p className="hint-text">
          Translations such as the King James Version (KJV), American Standard Version (ASV), and World English Bible (WEB) are in the public domain in the United States.
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>API Providers</h2>
        <p className="hint-text" style={{ marginBottom: 12 }}>
          <strong>API.Bible</strong><br />
          Bible texts are provided by the American Bible Society through API.Bible.
        </p>
        <p className="hint-text">
          <strong>YouVersion API</strong><br />
          Some supplementary data may be provided by the YouVersion Platform Core.
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link to="/settings" className="btn btn-ghost">
          ← Back to Settings
        </Link>
      </div>
      </div>
    </div>
  );
}
