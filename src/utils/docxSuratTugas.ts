import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { SuratTugasDocument, SchoolProfile } from "../types";

function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const pureBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const cleanStr = pureBase64.replace(/\s/g, "");
    const binaryString = atob(cleanStr);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn("Gagal konversi base64 ke Uint8Array:", err);
    return new Uint8Array(0);
  }
}

async function getRasterImageBytes(
  dataUrl: string
): Promise<{ data: Uint8Array; type: "png" | "jpg" }> {
  if (dataUrl.includes("image/svg+xml") || dataUrl.startsWith("<svg")) {
    return new Promise((resolve) => {
      const img = new Image();
      const encodedUrl = dataUrl.startsWith("<svg")
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dataUrl)}`
        : dataUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = 800;
          const height = Math.round(
            img.height && img.width ? (img.height / img.width) * width : 160
          );
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const pngUrl = canvas.toDataURL("image/png");
            resolve({
              data: base64ToUint8Array(pngUrl),
              type: "png",
            });
            return;
          }
        } catch (e) {
          console.warn("Canvas raster failed:", e);
        }
        resolve({ data: new Uint8Array(0), type: "png" });
      };
      img.onerror = () => resolve({ data: new Uint8Array(0), type: "png" });
      img.src = encodedUrl;
    });
  }

  const isJpg = dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg");
  return {
    data: base64ToUint8Array(dataUrl),
    type: isJpg ? "jpg" : "png",
  };
}

export async function exportSuratTugasToDocx(
  st: SuratTugasDocument,
  school: SchoolProfile
): Promise<void> {
  const children: any[] = [];

  // 1. Kop Surat
  const activeKop = school.kopSuratUrl;
  const isImageKop =
    activeKop &&
    (school.kopMode === "gambar" || activeKop.startsWith("data:image/"));

  if (isImageKop && activeKop) {
    try {
      const raster = await getRasterImageBytes(activeKop);
      if (raster.data.length > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new ImageRun({
                data: raster.data,
                transformation: {
                  width: 600,
                  height: 120,
                },
                type: raster.type,
              }),
            ],
          })
        );
      }
    } catch (e) {
      console.warn("Kop image export error:", e);
    }
  } else {
    // Mode Teks Resmi
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: school.pemerintahDaerah.toUpperCase(),
            bold: true,
            size: 24,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: school.dinasPendidikan.toUpperCase(),
            bold: true,
            size: 24,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: (school.namaKop || school.nama).toUpperCase(),
            bold: true,
            size: 28,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: `${school.alamat}, Desa ${school.desa}, Kec. ${school.kecamatan}, Kab. ${school.kabupaten}. Kode Pos: ${school.kodePos}. Email: ${school.email}`,
            italics: true,
            size: 18,
            font: "Arial",
          }),
        ],
      })
    );
  }

  // Double horizontal rule under Kop
  children.push(
    new Paragraph({
      border: {
        bottom: {
          style: BorderStyle.DOUBLE,
          size: 18,
          color: "000000",
        },
      },
      spacing: { after: 200 },
      children: [],
    })
  );

  // 2. Judul Dokumen
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "SURAT PERINTAH TUGAS",
          bold: true,
          underline: {},
          size: 28,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Nomor : ${st.nomor}`,
          bold: true,
          size: 22,
          font: "Arial",
        }),
      ],
    })
  );

  // 3. Dasar Hukum
  if (st.dasarHukum && st.dasarHukum.length > 0) {
    const dasarRows = st.dasarHukum.map((item, idx) => {
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 1000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: idx === 0 ? "Dasar" : "",
                    bold: idx === 0,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 400, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: idx === 0 ? ":" : "",
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 500, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `${idx + 1}.`,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7500, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: item,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 9400, type: WidthType.DXA },
        rows: dasarRows,
      }),
      new Paragraph({ spacing: { after: 120 }, children: [] })
    );
  }

  // 4. MEMERINTAHKAN
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 140 },
      children: [
        new TextRun({
          text: "MEMERINTAHKAN :",
          bold: true,
          size: 24,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Kepada :",
          bold: true,
          size: 22,
          font: "Arial",
        }),
      ],
    })
  );

  // 5. Tabel Pegawai Ditugaskan
  const tableHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 600, type: WidthType.DXA },
        shading: { fill: "F1F5F9" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "No", bold: true, size: 20, font: "Arial" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 2800, type: WidthType.DXA },
        shading: { fill: "F1F5F9" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Nama", bold: true, size: 20, font: "Arial" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        shading: { fill: "F1F5F9" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "NIP / NUPTK", bold: true, size: 20, font: "Arial" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 1800, type: WidthType.DXA },
        shading: { fill: "F1F5F9" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Pangkat / Gol.", bold: true, size: 20, font: "Arial" })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 2000, type: WidthType.DXA },
        shading: { fill: "F1F5F9" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Jabatan", bold: true, size: 20, font: "Arial" })],
          }),
        ],
      }),
    ],
  });

  const tableBody = st.pegawaiDitugaskan.map((peg, idx) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `${idx + 1}`, size: 20, font: "Arial" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2800, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: peg.nama, bold: true, size: 20, font: "Arial" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2200, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: peg.nip || "-", size: 20, font: "Arial" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: peg.pangkatGolongan || "-", size: 20, font: "Arial" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [new TextRun({ text: peg.jabatan || "-", size: 20, font: "Arial" })],
            }),
          ],
        }),
      ],
    });
  });

  children.push(
    new Table({
      width: { size: 9400, type: WidthType.DXA },
      rows: [tableHeader, ...tableBody],
    }),
    new Paragraph({ spacing: { after: 160 }, children: [] })
  );

  // 6. Untuk Keperluan
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Untuk :",
          bold: true,
          size: 22,
          font: "Arial",
        }),
      ],
    })
  );

  const untukDetails: { label: string; value: string }[] = [
    { label: "1. Keperluan", value: st.untukKeperluan },
    { label: "2. Hari / Tanggal", value: st.hariTanggal },
    { label: "3. Waktu", value: st.waktu },
    { label: "4. Tempat", value: st.tempat },
  ];

  if (st.bebanBiaya && st.bebanBiaya.trim() !== "") {
    untukDetails.push({ label: "5. Beban Biaya", value: st.bebanBiaya });
  }

  if (st.keteranganLain && st.keteranganLain.trim() !== "") {
    untukDetails.push({
      label: `${untukDetails.length + 1}. Keterangan`,
      value: st.keteranganLain,
    });
  }

  const untukRows = untukDetails.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 2200, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: item.label,
                  bold: true,
                  size: 22,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 400, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: ":",
                  bold: true,
                  size: 22,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 6800, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 60 },
              children: [
                new TextRun({
                  text: item.value,
                  size: 22,
                  font: "Arial",
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  children.push(
    new Table({
      width: { size: 9400, type: WidthType.DXA },
      rows: untukRows,
    }),
    new Paragraph({ spacing: { after: 140 }, children: [] })
  );

  // 7. Penutup
  children.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Demikian Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab dan setelah selesai melaksanakan tugas segera melaporkan hasilnya kepada Kepala Sekolah.",
          size: 22,
          font: "Arial",
        }),
      ],
    })
  );

  // 8. Tanda Tangan Kepala Sekolah
  const ttdTable = new Table({
    width: { size: 9400, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 4400, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: `Ditetapkan di : ${st.tempatTetap || school.desa}`,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `Pada tanggal  : ${st.tanggalTetap}`,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 700 }, // Ruang tanda tangan
                children: [
                  new TextRun({
                    text: `Kepala ${school.nama}`,
                    bold: true,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: st.kepalaSekolah.nama,
                    bold: true,
                    underline: {},
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP. ${st.kepalaSekolah.nip}`,
                    size: 22,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(ttdTable);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `Surat_Tugas_${st.nomor.replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
  saveAs(blob, safeFilename);
}
