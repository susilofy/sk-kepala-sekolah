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
  PageBreak,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { SKDocument, SchoolProfile } from "../types";
import { cleanSKJudul } from "./skFormatter";

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
    return new Promise((resolve, reject) => {
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
          } else {
            resolve({
              data: base64ToUint8Array(dataUrl),
              type: "png",
            });
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = encodedUrl;
    });
  }

  const isPng = dataUrl.toLowerCase().includes("image/png");
  return {
    data: base64ToUint8Array(dataUrl),
    type: isPng ? "png" : "jpg",
  };
}

export async function exportSKToDocx(doc: SKDocument, profile: SchoolProfile) {
  // Formal font: Times New Roman or Book Antiqua
  const FONT_FAMILY = "Times New Roman";

  // Section 1: Body of SK
  const children: (Paragraph | Table)[] = [];

  // --- KOP SURAT ---
  let isImageKopAdded = false;
  if (profile.kopMode === "gambar" && profile.kopSuratUrl) {
    try {
      const { data: imgBytes, type: imgType } = await getRasterImageBytes(profile.kopSuratUrl);
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new ImageRun({
              type: imgType,
              data: imgBytes,
              transformation: {
                width: 580,
                height: 120,
              },
            }),
          ],
        })
      );
      isImageKopAdded = true;
    } catch (e) {
      console.warn("Gagal menyematkan gambar kop di Word, beralih ke teks:", e);
      isImageKopAdded = false;
    }
  }

  if (!isImageKopAdded) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: profile.pemerintahDaerah.toUpperCase(),
            font: FONT_FAMILY,
            size: 26, // 13pt
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: profile.dinasPendidikan.toUpperCase(),
            font: FONT_FAMILY,
            size: 26, // 13pt
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: (profile.namaKop || profile.nama).toUpperCase(),
            font: FONT_FAMILY,
            size: 28, // 14pt
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        border: {
          bottom: {
            style: BorderStyle.DOUBLE,
            size: 24,
            color: "000000",
          },
        },
        children: [
          new TextRun({
            text: `${profile.alamat}, Desa ${profile.desa}, Kec. ${profile.kecamatan}, Kab. ${profile.kabupaten}. Kode Pos: ${profile.kodePos}. Email: ${profile.email}${profile.telepon ? ` | Telp: ${profile.telepon}` : ""}`,
            font: FONT_FAMILY,
            size: 18, // 9pt
            italics: true,
          }),
        ],
      })
    );
  }

  // Spacing after kop
  children.push(new Paragraph({ spacing: { before: 200 } }));

  // --- JUDUL SK ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `KEPUTUSAN KEPALA ${profile.nama.toUpperCase()}`,
          font: FONT_FAMILY,
          size: 24,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `NOMOR : ${doc.nomor}`,
          font: FONT_FAMILY,
          size: 22,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "TENTANG",
          font: FONT_FAMILY,
          size: 22,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: cleanSKJudul(doc.judul, doc.tahunAjaran).toUpperCase(),
          font: FONT_FAMILY,
          size: 24,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: `TAHUN AJARAN ${doc.tahunAjaran}`,
          font: FONT_FAMILY,
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  // Helper for two-column Konsiderans (Label vs Content)
  function createKonsideransTable(
    label: string,
    items: string[],
    isSingleText = false
  ): Table {
    const rows: TableRow[] = [];

    if (isSingleText) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      font: FONT_FAMILY,
                      size: 22,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 300, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 7900, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: { after: 120 },
                  children: [
                    new TextRun({
                      text: items[0] || "",
                      font: FONT_FAMILY,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    } else {
      items.forEach((item, idx) => {
        const letter = String.fromCharCode(97 + idx); // a, b, c, ...
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 1800, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: idx === 0 ? label : "",
                        font: FONT_FAMILY,
                        size: 22,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 300, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: idx === 0 ? ":" : "",
                        font: FONT_FAMILY,
                        size: 22,
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
                    children: [
                      new TextRun({
                        text: `${letter}.`,
                        font: FONT_FAMILY,
                        size: 22,
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
                    spacing: { after: 120 },
                    children: [
                      new TextRun({
                        text: item,
                        font: FONT_FAMILY,
                        size: 22,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      });
    }

    return new Table({
      rows,
      width: { size: 10000, type: WidthType.DXA },
    });
  }

  // --- MENIMBANG ---
  children.push(createKonsideransTable("Menimbang", doc.menimbang));
  children.push(new Paragraph({ spacing: { after: 140 } }));

  // --- MENGINGAT ---
  children.push(createKonsideransTable("Mengingat", doc.mengingat));
  children.push(new Paragraph({ spacing: { after: 140 } }));

  // --- MEMPERHATIKAN ---
  children.push(
    createKonsideransTable("Memperhatikan", [doc.memperhatikan], true)
  );
  children.push(new Paragraph({ spacing: { after: 240 } }));

  // --- MEMUTUSKAN ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120, before: 180 },
      children: [
        new TextRun({
          text: "MEMUTUSKAN",
          font: FONT_FAMILY,
          size: 24,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: "Menetapkan :",
          font: FONT_FAMILY,
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  // --- DIKTUM ---
  const diktumRows = doc.diktum.map(
    (d) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: d.poin.toUpperCase(),
                    font: FONT_FAMILY,
                    size: 22,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 300, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 22 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7900, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 140 },
                children: [
                  new TextRun({
                    text: d.isi,
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  children.push(
    new Table({
      rows: diktumRows,
      width: { size: 10000, type: WidthType.DXA },
    })
  );

  // Spacing before signature
  children.push(new Paragraph({ spacing: { before: 240, after: 120 } }));

  // --- TANDA TANGAN KEPALA SEKOLAH ---
  const signatureTable = new Table({
    width: { size: 10000, type: WidthType.DXA },
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
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 5000, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Ditetapkan di : ${doc.tempatTetap}`,
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Pada tanggal  : ${doc.tanggalTetap}`,
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 80, after: 800 }, // Space for physical signature / seal
                children: [
                  new TextRun({
                    text: `Kepala ${profile.nama}`,
                    font: FONT_FAMILY,
                    size: 22,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: doc.kepalaSekolah.nama,
                    font: FONT_FAMILY,
                    size: 22,
                    bold: true,
                    underline: {},
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `NIP : ${doc.kepalaSekolah.nip}`,
                    font: FONT_FAMILY,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(signatureTable);

  // --- TEMBUSAN ---
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({
          text: "Tembusan disampaikan kepada Yth :",
          font: FONT_FAMILY,
          size: 20,
          bold: true,
          underline: {},
        }),
      ],
    })
  );

  doc.tembusan.forEach((t, i) => {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: `${i + 1}. ${t}`,
            font: FONT_FAMILY,
            size: 20,
          }),
        ],
      })
    );
  });

  // --- LAMPIRAN - LAMPIRAN (PAGE BREAK & TABLES) ---
  if (doc.lampiranList && doc.lampiranList.length > 0) {
    doc.lampiranList.forEach((att) => {
      // Page break for each attachment
      children.push(new Paragraph({ children: [new PageBreak()] }));

      // Kop Lampiran Header
      const headerRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: att.nomorLampiran,
                      font: FONT_FAMILY,
                      size: 20,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 200, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 8300, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Keputusan Kepala ${profile.nama}`,
                      font: FONT_FAMILY,
                      size: 20,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Nomor",
                      font: FONT_FAMILY,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 200, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 8300, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: doc.nomor,
                      font: FONT_FAMILY,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Tanggal",
                      font: FONT_FAMILY,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 200, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 8300, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: doc.tanggalTetap,
                      font: FONT_FAMILY,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1500, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Tentang",
                      font: FONT_FAMILY,
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 200, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: ":", font: FONT_FAMILY, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 8300, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: att.judul,
                      font: FONT_FAMILY,
                      size: 20,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];

      children.push(
        new Table({
          rows: headerRows,
          width: { size: 10000, type: WidthType.DXA },
        })
      );
      children.push(new Paragraph({ spacing: { after: 200 } }));

      // Table construction
      const numCols = att.headers.length;
      const colWidth = Math.floor(10000 / numCols);

      const tableRows: TableRow[] = [];

      // Header Row
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: att.headers.map(
            (h, i) =>
              new TableCell({
                width: {
                  size: i === 0 ? 600 : i === 1 ? 2600 : colWidth,
                  type: WidthType.DXA,
                },
                shading: { fill: "E2E8F0" },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: h,
                        font: FONT_FAMILY,
                        size: 19,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
      );

      // Data Rows
      att.rows.forEach((row) => {
        tableRows.push(
          new TableRow({
            children: row.map((cellText, cellIdx) => {
              const lines = (cellText || "").split("\n");
              return new TableCell({
                width: {
                  size: cellIdx === 0 ? 600 : cellIdx === 1 ? 2600 : colWidth,
                  type: WidthType.DXA,
                },
                children: lines.map(
                  (line, lineIdx) =>
                    new Paragraph({
                      alignment:
                        cellIdx === 0
                          ? AlignmentType.CENTER
                          : cellIdx >= 5
                          ? AlignmentType.CENTER
                          : AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: line,
                          font: FONT_FAMILY,
                          size: 19,
                          bold:
                            cellIdx === 1 && lineIdx === 0 // bold the employee name
                              ? true
                              : false,
                        }),
                      ],
                    })
                ),
              });
            }),
          })
        );
      });

      // Footer note (e.g. Total Jam)
      if (att.footerNote) {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                columnSpan: numCols,
                shading: { fill: "F1F5F9" },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: att.footerNote,
                        font: FONT_FAMILY,
                        size: 20,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      }

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 10000, type: WidthType.DXA },
        })
      );

      // Attachment Signature block
      children.push(
        new Paragraph({ spacing: { before: 200 } }),
        new Table({
          width: { size: 10000, type: WidthType.DXA },
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
                  children: [new Paragraph({})],
                }),
                new TableCell({
                  width: { size: 5000, type: WidthType.DXA },
                  borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Ditetapkan di : ${doc.tempatTetap}`,
                          font: FONT_FAMILY,
                          size: 20,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Pada tanggal  : ${doc.tanggalTetap}`,
                          font: FONT_FAMILY,
                          size: 20,
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 60, after: 600 },
                      children: [
                        new TextRun({
                          text: `Kepala ${profile.nama}`,
                          font: FONT_FAMILY,
                          size: 20,
                          bold: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: doc.kepalaSekolah.nama,
                          font: FONT_FAMILY,
                          size: 20,
                          bold: true,
                          underline: {},
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `NIP : ${doc.kepalaSekolah.nip}`,
                          font: FONT_FAMILY,
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  // Create Document instance with formal margins (Left: 3cm, Top: 2.5cm, Right: 2.5cm, Bottom: 2.5cm)
  const wordDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1418, // 2.5 cm (1418 dxa)
              bottom: 1418, // 2.5 cm
              left: 1701, // 3.0 cm
              right: 1418, // 2.5 cm
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const cleanFilename = `SK_${doc.jenisSK.replace(/\s+/g, "_")}_${doc.tahunAjaran.replace(/\//g, "-")}_${profile.nama.replace(/\s+/g, "_")}.docx`;
  saveAs(blob, cleanFilename);
}
