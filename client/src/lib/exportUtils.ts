import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Add type support for jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export const exportToExcel = (data: any, fileName: string) => {
    const { monthly_sales, customer_growth, summary, retention_stats } = data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['Metric', 'Value'],
        ['Total Revenue (30d)', (summary.total_revenue || 0).toLocaleString()],
        ['Annual Revenue', (summary.total_annual_sales || summary.total_revenue || 0).toLocaleString()],
        ['Avg. Monthly Sales', (summary.avg_monthly_sales || 0).toLocaleString()],
        ['Total Customers', summary.total_customers || 0],
        ['Registered Customers', summary.registered_customers || 0],
        ['Walk-in Customers', summary.walk_in_customers || 0],
        ['Child Profiles', summary.child_customers || 0],
        ['Child Services Delivered', summary.child_visits_count || 0],
        ['Retention Rate (%)', `${retention_stats.retention_rate || 0}%`],
        ['Avg. Visits per Client', retention_stats.avg_visits_per_client || 0],
        ['Avg. Visit Value', (retention_stats.avg_visit_value || 0).toLocaleString()],
        ['Customer Satisfaction (Rating)', retention_stats.customer_rating || '-'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Business Summary');

    // Sales Data Sheet
    const salesData = [
        ['Month', 'Sales (KES)', 'New Customers'],
        ...monthly_sales.map((item: any) => [item.month, item.sales, item.customers])
    ];
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Monthly Performance');

    // Customer Growth Sheet
    const growthData = [
        ['Month', 'Active', 'VIP', 'Inactive'],
        ...customer_growth.map((item: any) => [item.month, item.active, item.vip, item.inactive])
    ];
    const wsGrowth = XLSX.utils.aoa_to_sheet(growthData);
    XLSX.utils.book_append_sheet(wb, wsGrowth, 'Customer Growth');

    // Write and save
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const finalData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(finalData, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportToPDF = (data: any, fileName: string) => {
    const doc = new jsPDF() as any;
    const dateStr = format(new Date(), 'dd MMM yyyy HH:mm');

    // Add Logo/Title
    doc.setFontSize(22);
    doc.setTextColor(120, 53, 15); // amber-900
    doc.text('ClientPulse Business Report', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dateStr}`, 14, 30);
    doc.text('------------------------------------------------------------------------------------------------------------------', 14, 35);

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Key Performance Indicators', 14, 45);

    const summaryHeaders = [['Metric', 'Value']];
    const summaryBody = [
        ['Annual Revenue', `KES ${(data.summary.total_annual_sales || data.summary.total_revenue || 0).toLocaleString()}`],
        ['Avg. Monthly Sales', `KES ${(data.summary.avg_monthly_sales || 0).toLocaleString()}`],
        ['Net Profit (30d)', `KES ${(data.summary.net_profit || 0).toLocaleString()}`],
        ['Retention Rate', `${data.retention_stats.retention_rate || 0}%`],
        ['Total Customers', (data.summary.total_customers || 0).toString()],
        ['Customer Satisfaction', `${data.retention_stats.customer_rating || '-'} / 5`],
    ];

    doc.autoTable({
        head: summaryHeaders,
        body: summaryBody,
        startY: 50,
        theme: 'striped',
        headStyles: { fillColor: [120, 53, 15] },
    });

    // Monthly Performance Table
    doc.setFontSize(16);
    doc.text('Monthly Revenue & Acquisition', 14, doc.lastAutoTable.finalY + 15);

    const salesHeaders = [['Month', 'Sales (KES)', 'New Customers']];
    const salesBody = data.monthly_sales.map((item: any) => [
        item.month,
        `KES ${item.sales.toLocaleString()}`,
        item.customers
    ]);

    doc.autoTable({
        head: salesHeaders,
        body: salesBody,
        startY: doc.lastAutoTable.finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9] }, // amber-700
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Private & Confidential`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
