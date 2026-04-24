<!DOCTYPE html>
<html lang="th">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: normal;
            src: url("{{ public_path('fonts/THSarabunNew.ttf') }}") format('truetype');
        }

        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: bold;
            src: url("{{ public_path('fonts/THSarabunNew Bold.ttf') }}") format('truetype');
        }

        /* Base Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14px;
            color: #000;
            line-height: 0.5;
        }

        /* ตั้งค่าหน้ากระดาษ PDF (ลบขอบขาวรอบๆ ที่ DomPDF ชอบใส่มา) */
        @page {
            margin: 8px 12px;
            /* บน/ล่าง 10px, ซ้าย/ขวา 5px */
        }

        /* ป้องกันไม่ให้ตารางล้น */
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            /* บังคับให้คอลัมน์กว้างตามที่เรากำหนด % */
        }

        td,
        th {
            padding: 3px 2px;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .bold {
            font-weight: bold;
        }

        /* เส้นคั่น - ลด margin ให้แคบลง ไม่ให้กินที่ */
        .hr-solid {
            border-top: 1px solid #000;
            margin: 4px 0;
        }

        .hr-dashed {
            border-top: 1px dashed #000;
            margin: 4px 0;
        }

        .hr-double {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            height: 2px;
            margin: 6px 0;
        }

        /* ปรับขนาดฟอนต์ให้เข้ากับหน้ากระดาษแบบสลิป (~80mm) */
        .header-logo {
            font-size: 13px;
            letter-spacing: 1px;
        }

        .header-brand {
            font-size: 26px;
            font-weight: bold;
            line-height: 0.5;
            margin: 2px 0;
        }

        .header-tel {
            font-size: 13px;
            margin-top: 2px;
        }

        /* ตารางไอเท็ม */
        .item-row td {
            font-size: 14px;
        }

        .item-name-row td {
            font-size: 13px;
            padding-left: 8px;
            padding-bottom: 3px;
            line-height: 0.5;
            color: #222;
        }

        .total-row td {
            font-size: 16px;
            padding: 4px 0;
        }

        .queue-number {
            font-size: 45px;
            line-height: 0.5;
            margin: 5px 0;
        }

        .tax-note {
            font-size: 12px;
            line-height: 1.0;
            margin-top: 5px;
        }

        /* ลายเซ็น */
        .signature-box {
            border-top: 1px dashed #000;
            width: 75%;
            margin: 25px auto 0;
        }

        .container {
            padding: 0 6px;
            /* เพิ่มระยะด้านข้างอีกชั้น */
        }
    </style>
</head>

<body>
    <div class="container">

        @php
        use Carbon\Carbon;
        $confirmedAt = Carbon::parse($receipt['confirmed_at']);
        $thYear = $confirmedAt->year + 543;
        $dateStr = $confirmedAt->format('d/m/') . substr($thYear, -2) . ' ' . $confirmedAt->format('H:i');

        $normalItems = array_values(array_filter($receipt['items'], fn($i) => !$i['is_free']));
        $freeItems = array_values(array_filter($receipt['items'], fn($i) => $i['is_free']));

        $pricing = $receipt['pricing'];
        $delivery = $receipt['delivery']['info'] ?? null;
        $shipQtys = $delivery['ship_qtys'] ?? [];

        $paymentLabel = match($receipt['payment_method']) {
        'transfer' => 'โอนเงิน',
        'cash' => 'เงินสด',
        'card' => 'บัตรเครดิต',
        default => $receipt['payment_method'],
        };
        @endphp

        <div class="text-center">
            <img src="{{ public_path('images/logo_pump.jpg') }}" style="max-width: 100px; height: auto; margin-bottom: 5px;">
            <div class="header-tel">โทร 02-899-5928</div>
        </div>

        <div class="hr-solid"></div>
        <div class="text-center bold" style="font-size: 16px;">ใบเสร็จรับเงิน</div>
        <div class="hr-solid"></div>

        <table style="font-size: 13px;">
            <tr>
                <td style="width: 20%;">เลขที่</td>
                <td class="text-right">{{ $receipt['token'] }}</td>
            </tr>
            <tr>
                <td>ลูกค้า</td>
                <td class="text-right">{{ $receipt['customer']['name'] ?? ($delivery['recipient_name'] ?? '-') }}</td>
            </tr>
            <tr>
                <td>วันที่</td>
                <td class="text-right">{{ $dateStr }}</td>
            </tr>
        </table>

        <div class="hr-solid"></div>

        <table style="font-size: 13px;">
            <tr>
                <th align="left" style="width: 25%;">รหัส</th>
                <th align="center" style="width: 15%;">จำนวน</th>
                <th align="right" style="width: 30%;">ราคา/ลด</th>
                <th align="right" style="width: 30%;">รวม</th>
            </tr>
        </table>
        <div class="hr-dashed"></div>

        @foreach($normalItems as $item)
        <table style="margin-bottom: 2px;">
            <tr class="item-row">
                <td style="width: 25%;">{{ $item['pid'] }}</td>
                <td align="center" style="width: 15%;">{{ $item['qty'] }}</td>
                <td align="right" style="width: 30%;">
                    {{ number_format($item['price'], 2) }}
                    @if($item['item_discount'] > 0)
                    <br><span style="font-size:11px; color:#555;">-{{ number_format($item['item_discount'], 2) }}</span>
                    @endif
                </td>
                <td align="right" style="width: 30%; vertical-align: middle;">{{ number_format($item['subtotal'], 2) }}</td>
            </tr>
            <tr class="item-name-row">
                <td colspan="4">• {{ $item['name'] }}</td>
            </tr>
        </table>
        @endforeach

        @if(count($freeItems) > 0)
        <div class="text-center" style="margin: 6px 0 3px; font-size: 13px;">-- ของแถม --</div>
        @foreach($freeItems as $item)
        <table style="margin-bottom: 2px;">
            <tr class="item-row">
                <td style="width: 25%;">{{ $item['pid'] }}</td>
                <td align="center" style="width: 15%;">{{ $item['qty'] }}</td>
                <td align="right" style="width: 60%;" class="bold">ฟรี!</td>
            </tr>
            <tr class="item-name-row">
                <td colspan="3">• {{ $item['name'] }}</td>
            </tr>
        </table>
        @endforeach
        @endif

        <div class="hr-dashed"></div>

        <table style="font-size: 13px;">
            <tr>
                <td>รวมสินค้า</td>
                <td class="text-right">{{ number_format($pricing['subtotal'], 2) }}</td>
            </tr>
            @if($pricing['discount'] > 0)
            <tr>
                <td>ส่วนลด ({{ $pricing['discpercent'] }}%)</td>
                <td class="text-right">-{{ number_format($pricing['discount'], 2) }}</td>
            </tr>
            @endif
            @if($pricing['vat_amount'] > 0)
            <tr>
                <td>VAT {{ $pricing['vat_percent'] }}%</td>
                <td class="text-right">{{ number_format($pricing['vat_amount'], 2) }}</td>
            </tr>
            @endif
        </table>

        <div class="hr-solid"></div>

        <table>
            <tr class="total-row bold">
                <td>รวมทั้งสิ้น</td>
                <td class="text-right">{{ number_format($pricing['total'], 2) }}</td>
            </tr>
        </table>

        <div class="hr-solid"></div>

        <table style="font-size: 13px;">
            <tr>
                <td>ชำระ ({{ $paymentLabel }})</td>
                <td class="text-right">{{ number_format($pricing['paid_amount'], 2) }}</td>
            </tr>
            @if(($pricing['change_amount'] ?? 0) > 0)
            <tr>
                <td>เงินทอน</td>
                <td class="text-right">{{ number_format($pricing['change_amount'], 2) }}</td>
            </tr>
            @endif
        </table>

        <div style="margin: 10px 0;"></div>

        <div class="text-center bold" style="font-size: 15px;">ขอบคุณที่ใช้บริการ</div>
        <div class="text-center" style="font-size: 13px; margin-top: 10px; margin-bottom: 10px;">แคชเชียร์ : {{ $receipt['cashier'] }}</div>

        <div class="hr-dashed"></div>

        <div class="text-center bold" style="font-size: 15px; margin-top: 15px;">หมายเลขคิว</div>
        <div class="text-center bold queue-number">{{ $receipt['seq'] }}</div>

        <div class="hr-dashed"></div>

        @if(!empty($receipt['tax_invoice']['taxno']))
        @php
        $taxUrl = 'https://asa-expo.pumpkin.tools/tax/' . $receipt['tax_invoice']['taxno'];
        $qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=90x90&margin=0&data=' . urlencode($taxUrl);

        // แปลงภาพจาก API เป็น Base64 เพื่อให้ DomPDF อ่านได้
        try {
        $qrData = base64_encode(file_get_contents($qrApiUrl));
        $qrSrc = 'data:image/png;base64,' . $qrData;
        } catch (\Exception $e) {
        $qrSrc = '';
        }
        @endphp

        <div class="text-center" style="margin: 8px 0;">
            @if($qrSrc)
            <img src="{{ $qrSrc }}" style="width: 90px; height: 90px;">
            @endif
        </div>
        <div class="text-center tax-note">
            ขอใบกำกับภาษีเต็มรูปแบบ (ไม่ใช่ E-Tax Invoice)<br>
            ภายในวันที่ซื้อสินค้า เท่านั้น<br>
            ทางบริษัทฯ จะจัดส่งภายในกำหนดเวลาที่แจ้งไว้<br>
            ภายใน 7 วัน นับจากที่แจ้งขอใบกำกับภาษี
        </div>
        @endif

        <div class="text-center bold" style="margin-top: 15px; line-height: 1.0;">
            # บริษัทขอสงวนสิทธิ์ไม่รับคืนสินค้า # <br> # เปลี่ยนสินค้าทุกกรณี #
        </div>

        @if($delivery)
        <div style="margin-top: 15px;">
            <div class="hr-double"></div>
            <div class="text-center bold" style="font-size: 16px; margin-top: 15px;">ใบส่งสินค้า</div>

            <table style="font-size: 13px;">
                <tr>
                    <td style="width: 25%;">เลขที่</td>
                    <td class="text-right">{{ $receipt['token'] }}</td>
                </tr>
                <tr>
                    <td>วันที่</td>
                    <td class="text-right">{{ $dateStr }}</td>
                </tr>
            </table>

            <div style="margin: 8px 0; line-height: 1.0; font-size: 13px;">
                <div class="bold">ผู้รับ / ที่อยู่จัดส่ง</div>
                <div>{{ $delivery['recipient_name'] ?? '' }}</div>
                <div>
                    {{ $delivery['address'] ?? '' }}
                    {{ $delivery['subdistrict'] ?? '' }}
                    {{ $delivery['district'] ?? '' }}
                    {{ $delivery['province'] ?? '' }}
                    {{ $delivery['postal'] ?? '' }}
                </div>
                <!-- <div>โทร</div> -->
                <table>
                    <tr>
                        <td style="width: 25%;">โทร</td>
                        <td class="text-right">{{ substr($delivery['phone'] ?? '', 0, 3) . str_repeat('*', max(0, strlen($delivery['phone'] ?? '') - 3)) }}
                        </td>
                    </tr>
                </table>
            </div>

            @if(count($shipQtys) > 0)
            @php
            $pidNameMap = [];
            foreach ($normalItems as $ni) {
            if (!isset($pidNameMap[$ni['pid']])) {
            $pidNameMap[$ni['pid']] = $ni['name'];
            }
            }
            @endphp

            <div class="hr-dashed"></div>

            <div class="bold" style="margin-top: 15px; font-size: 14px;">รายการสินค้า</div>
            <table style="font-size: 14px; margin-top: 5px;">
                <tr class="bold">
                    <td style="width: 80%;">รหัสสินค้า / ชื่อสินค้า</td>
                    <td align="right" style="width: 20%;">จำนวน</td>
                </tr>
            </table>
            <div class="hr-solid"></div>

            @foreach($shipQtys as $pid => $qty)
            <table style="margin-bottom: 5px; font-size: 13px;">
                <tr>
                    <td style="width: 80%; line-height: 0.5;">
                        <span class="bold">{{ $pid }}</span><br>
                        • {{ $pidNameMap[$pid] ?? '' }}
                    </td>
                    <td align="right" style="width: 20%; vertical-align: bottom;" class="bold">{{ $qty }}</td>
                </tr>
            </table>
            @endforeach
            <div class="hr-solid"></div>
            @endif

            <table style="margin-top: 15px;">
                <tr>
                    <td class="text-center" style="width: 50%;">
                        <div style="font-size: 13px;">ผู้ส่งสินค้า</div>
                        <div class="signature-box"></div>
                    </td>
                    <td class="text-center" style="width: 50%;">
                        <div style="font-size: 13px;">ผู้รับสินค้า</div>
                        <div class="signature-box"></div>
                    </td>
                </tr>
            </table>
        </div>
        @endif
    </div>

</body>

</html>