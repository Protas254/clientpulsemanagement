import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Add type support for jspdf-autotable
declare module 'jspdf' {
    interface jsPDF {
        // Only if using prototype method, but we will use the function approach
        autoTable: (options: any) => jsPDF;
        lastAutoTable: {
            finalY: number;
        };
    }
}

export const exportToExcel = (data: any, fileName: string) => {
    try {
        // Check if combined data or flat data
        const revenue = data.revenue || data;
        const customers = data.customers || {};
        const operations = data.operations || {};
        const dashboard = data.dashboard || {};
        const referrals = data.referrals || {};

        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['General Business Summary', 'Value'],
            ['Generated On', format(new Date(), 'dd MMM yyyy HH:mm')],
            [],
            ['Financial Overview', ''],
            ['Total Revenue (Period)', revenue.total_stats?.revenue || 0],
            ['Avg Ticket Size', revenue.total_stats?.avg_ticket || 0],
            ['This Month Growth', `${dashboard.this_month?.growth_percentage || 0}%`],
            [],
            ['Customer Metrics', ''],
            ['Total Customers', customers.overview?.total_customers || 0],
            ['New Customers (30d)', customers.overview?.new_customers_30d || 0],
            ['Retention Rate', `${customers.overview?.retention_rate || 0}%`],
            ['Average CLV', customers.lifetime_value?.avg_clv || 0],
            [],
            ['Operational Metrics', ''],
            ['Total Visits', revenue.total_stats?.visits || 0],
            ['Lead Conversion Rate', `${operations.rates?.conversion_rate || 0}%`],
            ['Completion Rate', `${operations.rates?.completion_rate || 0}%`],
            ['Cancellation Rate', `${operations.rates?.cancellation_rate || 0}%`],
            [],
            ['Referral Program', ''],
            ['Total Referrals', referrals.total_referrals || 0],
            ['Active Referrers', referrals.active_referrers || 0],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Business Overview');

        // Revenue Trend Sheet
        if (revenue.revenue_trend) {
            const trendData = [
                ['Date', 'Revenue (KES)', 'Visits', 'Avg Ticket'],
                ...revenue.revenue_trend.map((item: any) => [item.date, item.revenue, item.visits, item.avg_ticket])
            ];
            const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
            XLSX.utils.book_append_sheet(wb, wsTrend, 'Revenue Trend');
        }

        // Service Performance Sheet
        if (revenue.service_performance) {
            const serviceData = [
                ['Service Name', 'Category', 'Revenue (KES)', 'Count'],
                ...revenue.service_performance.map((item: any) => [item.service_name, item.category, item.revenue, item.count])
            ];
            const wsService = XLSX.utils.aoa_to_sheet(serviceData);
            XLSX.utils.book_append_sheet(wb, wsService, 'Service Performance');
        }

        // Staff Performance Sheet
        if (revenue.staff_performance) {
            const staffData = [
                ['Staff Name', 'Revenue (KES)', 'Visits', 'Avg Ticket'],
                ...revenue.staff_performance.map((item: any) => [item.staff_name, item.revenue, item.visits, item.avg_ticket])
            ];
            const wsStaff = XLSX.utils.aoa_to_sheet(staffData);
            XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff Performance');
        }

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const finalData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(finalData, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
        console.error('Error generating Excel:', error);
        throw error;
    }
};

export const exportToPDF = (data: any, fileName: string) => {
    try {
        const doc = new jsPDF() as any;
        const dateStr = format(new Date(), 'dd MMM yyyy HH:mm');

        // Extract data
        const revenue = data.revenue || (data.total_stats ? data : null);
        const customers = data.customers;
        const operations = data.operations;
        const dashboard = data.dashboard;
        const referrals = data.referrals;

        const fmt = (val: number) => `KES ${(val || 0).toLocaleString()}`;

        // Header
        const addHeader = (title: string) => {
            doc.setFontSize(22);
            doc.setTextColor(69, 26, 3);
            doc.text(title, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${dateStr}`, 14, 30);
            doc.text('------------------------------------------------------------------------------------------------------------------', 14, 35);
        };

        addHeader('ClientPulse Business Intelligence Report');

        // Section 1: Financial & Growth Overview
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('1. Financial & Growth Overview', 14, 45);

        const summaryBody = [
            ['Overall Revenue (Selected Period)', revenue ? fmt(revenue.total_stats?.revenue) : 'N/A'],
            ['Monthly Revenue Growth', dashboard ? `${dashboard.this_month?.growth_percentage || 0}%` : 'N/A'],
            ['Average Transaction Value', revenue ? fmt(revenue.total_stats?.avg_ticket) : 'N/A'],
            ['Retention Rate (LTM)', customers ? `${customers.overview?.retention_rate || 0}%` : 'N/A'],
            ['Total Client Base', customers ? (customers.overview?.total_customers || 0).toString() : 'N/A'],
            ['Registered vs Walk-in', dashboard ? `${dashboard.summary?.registered_customers || 0} / ${dashboard.summary?.walk_in_customers || 0}` : 'N/A'],
        ];

        autoTable(doc, {
            head: [['Key Performance Indicator', 'Current Value']],
            body: summaryBody,
            startY: 52,
            theme: 'striped',
            headStyles: { fillColor: [69, 26, 3] },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        let currentY = (doc as any).lastAutoTable?.finalY || 100;

        // Section 2: Revenue Trend
        if (revenue?.revenue_trend && revenue.revenue_trend.length > 0) {
            if (currentY + 60 > 280) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.text('2. Revenue Trend Analysis', 14, currentY + 15);

            const trendHeaders = [['Date Range', 'Revenue', 'Visits', 'Avg Ticket']];
            const trendBody = revenue.revenue_trend.slice(-10).map((item: any) => [
                item.date,
                fmt(item.revenue),
                (item.visits || 0).toString(),
                fmt(item.avg_ticket)
            ]);

            autoTable(doc, {
                head: trendHeaders,
                body: trendBody,
                startY: currentY + 20,
                theme: 'grid',
                headStyles: { fillColor: [180, 83, 9] },
                styles: { fontSize: 9 },
            });
            currentY = (doc as any).lastAutoTable?.finalY || currentY + 100;
        }

        // Section 3: Operational Efficiency
        if (operations) {
            if (currentY + 60 > 280) { doc.addPage(); currentY = 20; }
            else { currentY += 15; }

            doc.setFontSize(14);
            doc.text('3. Operational Performance', 14, currentY);

            const opBody = [
                ['Booking Conversion Rate', `${operations.rates?.conversion_rate || 0}%`],
                ['Cancellation Rate', `${operations.rates?.cancellation_rate || 0}%`],
                ['Completion Rate', `${operations.rates?.completion_rate || 0}%`],
                ['Avg Lead Time (Days)', (operations.avg_lead_time_days || 0).toString()],
            ];

            autoTable(doc, {
                head: [['Operational Metric', 'Efficiency % / Value']],
                body: opBody,
                startY: currentY + 5,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] },
                styles: { fontSize: 10 },
            });
            currentY = (doc as any).lastAutoTable?.finalY || currentY + 60;
        }

        // Section 4: Top Performing Services
        if (revenue?.service_performance) {
            if (currentY + 60 > 280) { doc.addPage(); currentY = 20; }
            else { currentY += 15; }

            doc.setFontSize(14);
            doc.text('4. Service Performance (Top 5)', 14, currentY);

            const serviceHeaders = [['Service Name', 'Category', 'Revenue', 'Visits']];
            const serviceBody = revenue.service_performance.slice(0, 5).map((item: any) => [
                item.service_name,
                item.category,
                fmt(item.revenue),
                (item.count || 0).toString()
            ]);

            autoTable(doc, {
                head: serviceHeaders,
                body: serviceBody,
                startY: currentY + 5,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] },
                styles: { fontSize: 9 },
            });
            currentY = (doc as any).lastAutoTable?.finalY || currentY + 60;
        }

        // Finalize
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `ClientPulse - Confidential Business Report - Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`${fileName}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
