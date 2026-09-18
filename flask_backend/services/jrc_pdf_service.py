import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from config import Config

class JRCPdfService:
    @staticmethod
    def generate_certificate(mill_name, manager_name, mill_code, total_paddy_qtl, cmr_67_target_qtl, subsidy_amount, certificate_id):
        """
        Generates an official Government of Telangana Joint Reconciliation Certificate (JRC) in PDF format.
        """
        os.makedirs(Config.CERT_FOLDER, exist_ok=True)
        pdf_path = os.path.join(Config.CERT_FOLDER, f"{certificate_id}.pdf")
        
        doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#064e3b'),
            alignment=1
        )
        
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#0f766e'),
            alignment=1
        )

        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1e293b')
        )

        story.append(Paragraph("GOVERNMENT OF TELANGANA", title_style))
        story.append(Paragraph("DEPARTMENT OF FOOD & CIVIL SUPPLIES • WARANGAL DISTRICT", subtitle_style))
        story.append(Paragraph("<b>STATUTORY JOINT RECONCILIATION & CMR SUBSIDY CLEARANCE CERTIFICATE (JRC)</b>", subtitle_style))
        story.append(Spacer(1, 15))

        data = [
            ["Certificate No:", certificate_id, "Date of Clearance:", "September 15, 2026"],
            ["Rice Mill Name:", mill_name, "Mill Registration Code:", mill_code],
            ["Mill Manager:", manager_name, "District Authority:", "Officer R. Kumar (DCSO)"],
            ["Total Reconciled Paddy:", f"{total_paddy_qtl:,.2f} Quintals", "CMR 67% Target Rice:", f"{cmr_67_target_qtl:,.2f} Quintals"],
            ["Milling Subsidy Rate:", "Rs 10.00 / Qtl", "Handling Charges:", "Rs 4.50 / Qtl"],
            ["Total Subsidy Approved:", f"Rs {subsidy_amount:,.2f}", "PFMS Payment Ref:", f"PFMS-TS-2025-CLEAR-{mill_code[-4:]}"]
        ]

        t = Table(data, colWidths=[130, 140, 130, 140])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0f172a')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0f766e')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        endorsement = ("<b>Statutory Endorsement:</b> This is to certify that the inward weighbridge records for the custom milling "
                       "of paddy have been jointly inspected, calibrated, and reconciled with Telangana OPMS Mandi manifest records. "
                       "The 67% CMR delivery obligation is hereby finalized, and the direct benefit subsidy disbursement is authorized.")
        story.append(Paragraph(endorsement, body_style))
        story.append(Spacer(1, 35))

        sig_data = [
            [Paragraph(f"<b>{manager_name}</b><br/>Authorized Signatory<br/>{mill_name}", body_style), 
             Paragraph("<b>Officer R. Kumar (DCSO)</b><br/>District Civil Supplies Officer<br/>Warangal District, Govt of Telangana", body_style)]
        ]
        sig_table = Table(sig_data, colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#94a3b8')),
            ('LINEABOVE', (1,0), (1,0), 1, colors.HexColor('#94a3b8')),
        ]))
        story.append(sig_table)

        doc.build(story)
        return pdf_path
