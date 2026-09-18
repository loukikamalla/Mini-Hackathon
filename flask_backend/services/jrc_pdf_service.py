import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from config import Config

class JRCPdfService:
    @staticmethod
    def generate_certificate(mill_name, manager_name, mill_code, total_paddy_qtl, cmr_67_target_qtl, subsidy_amount, certificate_id):
        """
        Generates an official Government of Telangana Joint Reconciliation Certificate (JRC)
        with QR code, digital verification stamp, and statutory 67% CMR / ₹25 Remuneration breakdown.
        """
        os.makedirs(Config.CERT_FOLDER, exist_ok=True)
        pdf_path = os.path.join(Config.CERT_FOLDER, f"{certificate_id}.pdf")
        
        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=32, bottomMargin=32)
        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'GovtTitleStyle',
            parent=styles['Heading1'],
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#012B1B'),
            alignment=1
        )
        
        subtitle_style = ParagraphStyle(
            'GovtSubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#059669'),
            alignment=1
        )

        doc_title_style = ParagraphStyle(
            'DocTitleStyle',
            parent=styles['Normal'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#0f172a'),
            alignment=1
        )

        body_style = ParagraphStyle(
            'GovtBodyStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1e293b')
        )

        # 1. Header
        story.append(Paragraph("<b>GOVERNMENT OF TELANGANA</b>", title_style))
        story.append(Paragraph("DEPARTMENT OF FOOD & CIVIL SUPPLIES • WARANGAL DISTRICT", subtitle_style))
        story.append(Paragraph("<b>STATUTORY JOINT RECONCILIATION & CMR 67% SUBSIDY CLEARANCE CERTIFICATE (JRC)</b>", doc_title_style))
        story.append(Spacer(1, 10))

        # 2. Main Parameters Table
        pfms_token = f"PFMS-TS-2025-CLEAR-{mill_code[-4:]}"
        data = [
            ["Certificate No:", certificate_id, "Date of Clearance:", "September 18, 2026"],
            ["Rice Mill Name:", mill_name, "Mill Registration Code:", mill_code],
            ["Mill Manager:", manager_name, "District Authority:", "Officer R. Kumar (DCSO)"],
            ["Reconciled Paddy Intake:", f"{total_paddy_qtl:,.2f} Quintals", "CMR 67% Out-Turn Target:", f"{cmr_67_target_qtl:,.2f} Qtl (Raw Rice)"],
            ["Statutory Remuneration Rate:", "₹ 25.00 / Qtl (Milling + Handling)", "PFMS Payment Ref:", pfms_token],
            ["Total Approved Subsidy:", f"₹ {subsidy_amount:,.2f}", "Reconciliation Status:", "100% RECONCILED & CLEARED"]
        ]

        t = Table(data, colWidths=[140, 140, 130, 130])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0f172a')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#059669')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

        # 3. Statutory Remuneration Breakdown Table
        breakdown_data = [
            ["Item Description", "Statutory Norm Rate", "Reconciled Quantity", "Computed Liability (₹)"],
            ["Custom Milling Remuneration (CMR)", "₹ 10.00 / Qtl", f"{total_paddy_qtl:,.2f} Qtl", f"₹ {total_paddy_qtl * 10.00:,.2f}"],
            ["Paddy Handling & Unloading Charges", "₹ 4.50 / Qtl", f"{total_paddy_qtl:,.2f} Qtl", f"₹ {total_paddy_qtl * 4.50:,.2f}"],
            ["New Gunny Bag Depreciation Credit", "₹ 4.40 / Qtl", f"{total_paddy_qtl:,.2f} Qtl", f"₹ {total_paddy_qtl * 4.40:,.2f}"],
            ["Quality & Timely Delivery Incentive", "₹ 6.10 / Qtl", f"{total_paddy_qtl:,.2f} Qtl", f"₹ {total_paddy_qtl * 6.10:,.2f}"],
            ["Total Statutory Disbursement Dues", "₹ 25.00 / Qtl", f"{total_paddy_qtl:,.2f} Qtl", f"₹ {subsidy_amount:,.2f}"]
        ]
        bt = Table(breakdown_data, colWidths=[180, 110, 110, 140])
        bt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#012B1B')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,1), (-1,-2), colors.HexColor('#f0fdf4')),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#dcfce7')),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10B981')),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(bt)
        story.append(Spacer(1, 10))

        # 4. Statutory Legal Endorsement
        endorsement = ("<b>Statutory Endorsement:</b> This Joint Reconciliation Certificate (JRC) certifies that the inward weighbridge "
                       "intake records for paddy procurement have been cross-verified with the Government OPMS Mandi manifests. "
                       "The statutory 67% Custom Milling of Rice (CMR) delivery schedule has been finalized. Treasury clearance is "
                       "authorized under the direct supervision of the District Civil Supplies Office, Warangal.")
        story.append(Paragraph(endorsement, body_style))
        story.append(Spacer(1, 12))

        # 5. QR Code & Dual Signatures Block
        verification_url = f"https://epds.telangana.gov.in/verify/jrc?cert={certificate_id}&token={pfms_token}"
        qr_widget = qr.QrCodeWidget(verification_url)
        bounds = qr_widget.getBounds()
        w = bounds[2] - bounds[0]
        h = bounds[3] - bounds[1]
        qr_drawing = Drawing(70, 70, transform=[70/w, 0, 0, 70/h, 0, 0])
        qr_drawing.add(qr_widget)

        sig_data = [
            [
                Paragraph(f"<b>{manager_name}</b><br/>Authorized Mill Manager<br/>{mill_name}<br/><i>(Digitally Acknowledged)</i>", body_style),
                qr_drawing,
                Paragraph("<b>Officer R. Kumar (DCSO)</b><br/>District Civil Supplies Officer<br/>Warangal District, Govt of TS<br/><font color='#059669'><b>[PFMS DIGITALLY SIGNED]</b></font>", body_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[200, 90, 250])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'CENTER'),
            ('ALIGN', (2,0), (2,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#94a3b8')),
            ('LINEABOVE', (2,0), (2,0), 1, colors.HexColor('#059669')),
        ]))
        story.append(sig_table)

        doc.build(story)
        return pdf_path

