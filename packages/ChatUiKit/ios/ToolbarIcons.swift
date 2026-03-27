import UIKit

/// Provides vector icons for the rich text editor toolbar
/// Icons match the Android VectorDrawable implementations for cross-platform consistency
class ToolbarIcons {

    static func getIcon(for option: String, color: UIColor, size: CGSize = CGSize(width: 24, height: 24)) -> UIImage? {
        switch option {
        case "bold": return drawBoldIcon(color: color, size: size)
        case "italic": return drawItalicIcon(color: color, size: size)
        case "underline": return drawUnderlineIcon(color: color, size: size)
        case "strikethrough": return drawStrikethroughIcon(color: color, size: size)
        case "code": return drawCodeIcon(color: color, size: size)
        case "highlight": return drawHighlightIcon(color: color, size: size)
        case "heading": return drawHeadingIcon(color: color, size: size)
        case "bullet": return drawBulletListIcon(color: color, size: size)
        case "numbered": return drawNumberedListIcon(color: color, size: size)
        case "quote": return drawQuoteIcon(color: color, size: size)
        case "checklist": return drawChecklistIcon(color: color, size: size)
        case "link": return drawLinkIcon(color: color, size: size)
        case "undo": return drawUndoIcon(color: color, size: size)
        case "redo": return drawRedoIcon(color: color, size: size)
        case "clearFormatting": return drawClearFormattingIcon(color: color, size: size)
        case "indent": return drawIndentIcon(color: color, size: size)
        case "outdent": return drawOutdentIcon(color: color, size: size)
        case "alignLeft": return drawAlignLeftIcon(color: color, size: size)
        case "alignCenter": return drawAlignCenterIcon(color: color, size: size)
        case "alignRight": return drawAlignRightIcon(color: color, size: size)
        default: return nil
        }
    }

    // MARK: - Icon Drawing Methods

    private static func drawBoldIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 15.6 * scale, y: 10.79 * scale))
            path.addCurve(to: CGPoint(x: 17.25 * scale, y: 8 * scale),
                         controlPoint1: CGPoint(x: 16.57 * scale, y: 10.12 * scale),
                         controlPoint2: CGPoint(x: 17.25 * scale, y: 9.02 * scale))
            path.addCurve(to: CGPoint(x: 13.25 * scale, y: 4 * scale),
                         controlPoint1: CGPoint(x: 17.25 * scale, y: 5.74 * scale),
                         controlPoint2: CGPoint(x: 15.5 * scale, y: 4 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 4 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 18 * scale))
            path.addLine(to: CGPoint(x: 14.04 * scale, y: 18 * scale))
            path.addCurve(to: CGPoint(x: 17.75 * scale, y: 14.21 * scale),
                         controlPoint1: CGPoint(x: 16.13 * scale, y: 18 * scale),
                         controlPoint2: CGPoint(x: 17.75 * scale, y: 16.51 * scale))
            path.addCurve(to: CGPoint(x: 15.6 * scale, y: 10.79 * scale),
                         controlPoint1: CGPoint(x: 17.75 * scale, y: 12.69 * scale),
                         controlPoint2: CGPoint(x: 16.89 * scale, y: 11.39 * scale))
            path.close()

            path.move(to: CGPoint(x: 10 * scale, y: 6.5 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 6.5 * scale))
            path.addCurve(to: CGPoint(x: 14.5 * scale, y: 8 * scale),
                         controlPoint1: CGPoint(x: 13.83 * scale, y: 6.5 * scale),
                         controlPoint2: CGPoint(x: 14.5 * scale, y: 7.17 * scale))
            path.addCurve(to: CGPoint(x: 13 * scale, y: 9.5 * scale),
                         controlPoint1: CGPoint(x: 14.5 * scale, y: 8.83 * scale),
                         controlPoint2: CGPoint(x: 13.83 * scale, y: 9.5 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 9.5 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 6.5 * scale))
            path.close()

            path.move(to: CGPoint(x: 13.5 * scale, y: 15.5 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 15.5 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 12.5 * scale))
            path.addLine(to: CGPoint(x: 13.5 * scale, y: 12.5 * scale))
            path.addCurve(to: CGPoint(x: 15 * scale, y: 14 * scale),
                         controlPoint1: CGPoint(x: 14.33 * scale, y: 12.5 * scale),
                         controlPoint2: CGPoint(x: 15 * scale, y: 13.17 * scale))
            path.addCurve(to: CGPoint(x: 13.5 * scale, y: 15.5 * scale),
                         controlPoint1: CGPoint(x: 15 * scale, y: 14.83 * scale),
                         controlPoint2: CGPoint(x: 14.33 * scale, y: 15.5 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawItalicIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 10 * scale, y: 4 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 12.21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 8.79 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 18 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 18 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 11.79 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 15.21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 4 * scale))
            path.close()
            path.fill()
        }
    }

    private static func drawUnderlineIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // U shape
            path.move(to: CGPoint(x: 12 * scale, y: 17 * scale))
            path.addCurve(to: CGPoint(x: 18 * scale, y: 11 * scale),
                         controlPoint1: CGPoint(x: 15.31 * scale, y: 17 * scale),
                         controlPoint2: CGPoint(x: 18 * scale, y: 14.31 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 15.5 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 15.5 * scale, y: 11 * scale))
            path.addCurve(to: CGPoint(x: 12 * scale, y: 14.5 * scale),
                         controlPoint1: CGPoint(x: 15.5 * scale, y: 12.93 * scale),
                         controlPoint2: CGPoint(x: 13.93 * scale, y: 14.5 * scale))
            path.addCurve(to: CGPoint(x: 8.5 * scale, y: 11 * scale),
                         controlPoint1: CGPoint(x: 10.07 * scale, y: 14.5 * scale),
                         controlPoint2: CGPoint(x: 8.5 * scale, y: 12.93 * scale))
            path.addLine(to: CGPoint(x: 8.5 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 11 * scale))
            path.addCurve(to: CGPoint(x: 12 * scale, y: 17 * scale),
                         controlPoint1: CGPoint(x: 6 * scale, y: 14.31 * scale),
                         controlPoint2: CGPoint(x: 8.69 * scale, y: 17 * scale))
            path.close()

            // Underline
            path.move(to: CGPoint(x: 5 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 5 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 19 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawStrikethroughIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Top part
            path.move(to: CGPoint(x: 10 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 16 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 16 * scale))
            path.close()

            // S shape top
            path.move(to: CGPoint(x: 5 * scale, y: 4 * scale))
            path.addLine(to: CGPoint(x: 5 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 10 * scale, y: 10 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 10 * scale))
            path.addLine(to: CGPoint(x: 14 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 4 * scale))
            path.close()

            // Strike line
            path.move(to: CGPoint(x: 3 * scale, y: 14 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 14 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 12 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawCodeIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Left bracket <
            path.move(to: CGPoint(x: 9.4 * scale, y: 16.6 * scale))
            path.addLine(to: CGPoint(x: 4.8 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 9.4 * scale, y: 7.4 * scale))
            path.addLine(to: CGPoint(x: 8 * scale, y: 6 * scale))
            path.addLine(to: CGPoint(x: 2 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 8 * scale, y: 18 * scale))
            path.close()

            // Right bracket >
            path.move(to: CGPoint(x: 14.6 * scale, y: 16.6 * scale))
            path.addLine(to: CGPoint(x: 19.2 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 14.6 * scale, y: 7.4 * scale))
            path.addLine(to: CGPoint(x: 16 * scale, y: 6 * scale))
            path.addLine(to: CGPoint(x: 22 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 16 * scale, y: 18 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawHighlightIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Marker body
            path.move(to: CGPoint(x: 6 * scale, y: 14 * scale))
            path.addLine(to: CGPoint(x: 9 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 9 * scale, y: 22 * scale))
            path.addLine(to: CGPoint(x: 15 * scale, y: 22 * scale))
            path.addLine(to: CGPoint(x: 15 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 14 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 9 * scale))
            path.close()

            // Top line
            path.move(to: CGPoint(x: 11 * scale, y: 2 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 2 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 5 * scale))
            path.close()

            // Left ray
            path.move(to: CGPoint(x: 3.5 * scale, y: 5.88 * scale))
            path.addLine(to: CGPoint(x: 4.91 * scale, y: 4.47 * scale))
            path.addLine(to: CGPoint(x: 7.03 * scale, y: 6.59 * scale))
            path.addLine(to: CGPoint(x: 5.62 * scale, y: 8 * scale))
            path.close()

            // Right ray
            path.move(to: CGPoint(x: 16.96 * scale, y: 6.59 * scale))
            path.addLine(to: CGPoint(x: 19.08 * scale, y: 4.47 * scale))
            path.addLine(to: CGPoint(x: 20.49 * scale, y: 5.88 * scale))
            path.addLine(to: CGPoint(x: 18.37 * scale, y: 8 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawHeadingIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 5 * scale, y: 4 * scale))
            path.addLine(to: CGPoint(x: 5 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 10.5 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 10.5 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 13.5 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 13.5 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 4 * scale))
            path.close()
            path.fill()
        }
    }

    private static func drawBulletListIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Bullets
            path.append(UIBezierPath(ovalIn: CGRect(x: 2.5 * scale, y: 10.5 * scale, width: 3 * scale, height: 3 * scale)))
            path.append(UIBezierPath(ovalIn: CGRect(x: 2.5 * scale, y: 4.5 * scale, width: 3 * scale, height: 3 * scale)))
            path.append(UIBezierPath(ovalIn: CGRect(x: 2.5 * scale, y: 16.5 * scale, width: 3 * scale, height: 3 * scale)))

            // Lines
            path.move(to: CGPoint(x: 7 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 17 * scale))
            path.close()

            path.move(to: CGPoint(x: 7 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 11 * scale))
            path.close()

            path.move(to: CGPoint(x: 7 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawNumberedListIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            // Draw numbers using text
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .left
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 8 * scale, weight: .medium),
                .foregroundColor: color
            ]

            "1".draw(at: CGPoint(x: 3 * scale, y: 4 * scale), withAttributes: attrs)
            "2".draw(at: CGPoint(x: 3 * scale, y: 10 * scale), withAttributes: attrs)
            "3".draw(at: CGPoint(x: 3 * scale, y: 16 * scale), withAttributes: attrs)

            // Lines
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 7 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.close()

            path.move(to: CGPoint(x: 7 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 11 * scale))
            path.close()

            path.move(to: CGPoint(x: 7 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 17 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawQuoteIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Left quote
            path.move(to: CGPoint(x: 6 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 9 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 5 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 5 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 8 * scale, y: 13 * scale))
            path.close()

            // Right quote
            path.move(to: CGPoint(x: 14 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 19 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 16 * scale, y: 13 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawChecklistIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Lines
            path.move(to: CGPoint(x: 22 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 22 * scale, y: 9 * scale))
            path.close()

            path.move(to: CGPoint(x: 22 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 22 * scale, y: 17 * scale))
            path.close()

            // Checkmarks
            path.move(to: CGPoint(x: 5.54 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 2 * scale, y: 7.46 * scale))
            path.addLine(to: CGPoint(x: 3.41 * scale, y: 6.05 * scale))
            path.addLine(to: CGPoint(x: 5.53 * scale, y: 8.17 * scale))
            path.addLine(to: CGPoint(x: 9.77 * scale, y: 3.93 * scale))
            path.addLine(to: CGPoint(x: 11.18 * scale, y: 5.34 * scale))
            path.close()

            path.move(to: CGPoint(x: 5.54 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 2 * scale, y: 15.46 * scale))
            path.addLine(to: CGPoint(x: 3.41 * scale, y: 14.05 * scale))
            path.addLine(to: CGPoint(x: 5.53 * scale, y: 16.17 * scale))
            path.addLine(to: CGPoint(x: 9.77 * scale, y: 11.93 * scale))
            path.addLine(to: CGPoint(x: 11.18 * scale, y: 13.34 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawLinkIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Left chain
            path.move(to: CGPoint(x: 3.9 * scale, y: 12 * scale))
            path.addCurve(to: CGPoint(x: 7 * scale, y: 8.9 * scale),
                         controlPoint1: CGPoint(x: 3.9 * scale, y: 10.29 * scale),
                         controlPoint2: CGPoint(x: 5.29 * scale, y: 8.9 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 8.9 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 7 * scale))
            path.addCurve(to: CGPoint(x: 2 * scale, y: 12 * scale),
                         controlPoint1: CGPoint(x: 4.24 * scale, y: 7 * scale),
                         controlPoint2: CGPoint(x: 2 * scale, y: 9.24 * scale))
            path.addCurve(to: CGPoint(x: 7 * scale, y: 17 * scale),
                         controlPoint1: CGPoint(x: 2 * scale, y: 14.76 * scale),
                         controlPoint2: CGPoint(x: 4.24 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 15.1 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 15.1 * scale))
            path.addCurve(to: CGPoint(x: 3.9 * scale, y: 12 * scale),
                         controlPoint1: CGPoint(x: 5.29 * scale, y: 15.1 * scale),
                         controlPoint2: CGPoint(x: 3.9 * scale, y: 13.71 * scale))
            path.close()

            // Middle bar
            path.move(to: CGPoint(x: 8 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 16 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 16 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 8 * scale, y: 11 * scale))
            path.close()

            // Right chain
            path.move(to: CGPoint(x: 17 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 8.9 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 8.9 * scale))
            path.addCurve(to: CGPoint(x: 20.1 * scale, y: 12 * scale),
                         controlPoint1: CGPoint(x: 18.71 * scale, y: 8.9 * scale),
                         controlPoint2: CGPoint(x: 20.1 * scale, y: 10.29 * scale))
            path.addCurve(to: CGPoint(x: 17 * scale, y: 15.1 * scale),
                         controlPoint1: CGPoint(x: 20.1 * scale, y: 13.71 * scale),
                         controlPoint2: CGPoint(x: 18.71 * scale, y: 15.1 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 15.1 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 17 * scale))
            path.addCurve(to: CGPoint(x: 22 * scale, y: 12 * scale),
                         controlPoint1: CGPoint(x: 19.76 * scale, y: 17 * scale),
                         controlPoint2: CGPoint(x: 22 * scale, y: 14.76 * scale))
            path.addCurve(to: CGPoint(x: 17 * scale, y: 7 * scale),
                         controlPoint1: CGPoint(x: 22 * scale, y: 9.24 * scale),
                         controlPoint2: CGPoint(x: 19.76 * scale, y: 7 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawUndoIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 12.5 * scale, y: 8 * scale))
            path.addCurve(to: CGPoint(x: 5.67 * scale, y: 10.73 * scale),
                         controlPoint1: CGPoint(x: 9.85 * scale, y: 8 * scale),
                         controlPoint2: CGPoint(x: 7.45 * scale, y: 9.04 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 12 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 9.19 * scale, y: 14.19 * scale))
            path.addCurve(to: CGPoint(x: 14.25 * scale, y: 12.25 * scale),
                         controlPoint1: CGPoint(x: 10.55 * scale, y: 12.98 * scale),
                         controlPoint2: CGPoint(x: 12.33 * scale, y: 12.25 * scale))
            path.addCurve(to: CGPoint(x: 21.14 * scale, y: 18.25 * scale),
                         controlPoint1: CGPoint(x: 17.77 * scale, y: 12.25 * scale),
                         controlPoint2: CGPoint(x: 20.69 * scale, y: 14.86 * scale))
            path.addLine(to: CGPoint(x: 23 * scale, y: 18.25 * scale))
            path.addCurve(to: CGPoint(x: 14.25 * scale, y: 10.25 * scale),
                         controlPoint1: CGPoint(x: 22.54 * scale, y: 13.74 * scale),
                         controlPoint2: CGPoint(x: 18.9 * scale, y: 10.25 * scale))
            path.addCurve(to: CGPoint(x: 12.5 * scale, y: 8 * scale),
                         controlPoint1: CGPoint(x: 13.66 * scale, y: 9.35 * scale),
                         controlPoint2: CGPoint(x: 13.05 * scale, y: 8.55 * scale))
            path.close()
            path.fill()
        }
    }

    private static func drawRedoIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 18.4 * scale, y: 10.6 * scale))
            path.addCurve(to: CGPoint(x: 11.5 * scale, y: 8 * scale),
                         controlPoint1: CGPoint(x: 16.55 * scale, y: 8.99 * scale),
                         controlPoint2: CGPoint(x: 14.15 * scale, y: 8 * scale))
            path.addCurve(to: CGPoint(x: 1.54 * scale, y: 15.22 * scale),
                         controlPoint1: CGPoint(x: 6.85 * scale, y: 8 * scale),
                         controlPoint2: CGPoint(x: 2.92 * scale, y: 11.03 * scale))
            path.addLine(to: CGPoint(x: 3.9 * scale, y: 16 * scale))
            path.addCurve(to: CGPoint(x: 11.5 * scale, y: 10.5 * scale),
                         controlPoint1: CGPoint(x: 4.95 * scale, y: 12.81 * scale),
                         controlPoint2: CGPoint(x: 7.95 * scale, y: 10.5 * scale))
            path.addCurve(to: CGPoint(x: 16.62 * scale, y: 12.38 * scale),
                         controlPoint1: CGPoint(x: 13.45 * scale, y: 10.5 * scale),
                         controlPoint2: CGPoint(x: 15.23 * scale, y: 11.22 * scale))
            path.addLine(to: CGPoint(x: 13 * scale, y: 16 * scale))
            path.addLine(to: CGPoint(x: 22 * scale, y: 16 * scale))
            path.addLine(to: CGPoint(x: 22 * scale, y: 7 * scale))
            path.close()
            path.fill()
        }
    }

    private static func drawClearFormattingIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Diagonal line
            path.move(to: CGPoint(x: 3.27 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 2 * scale, y: 6.27 * scale))
            path.addLine(to: CGPoint(x: 8.97 * scale, y: 13.24 * scale))
            path.addLine(to: CGPoint(x: 6.5 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 9.5 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 11.07 * scale, y: 15.34 * scale))
            path.addLine(to: CGPoint(x: 16.73 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 18 * scale, y: 19.73 * scale))
            path.addLine(to: CGPoint(x: 3.55 * scale, y: 5.27 * scale))
            path.close()

            // T shape
            path.move(to: CGPoint(x: 6 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 6 * scale, y: 5.18 * scale))
            path.addLine(to: CGPoint(x: 8.82 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 11.22 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 10.5 * scale, y: 9.68 * scale))
            path.addLine(to: CGPoint(x: 12.6 * scale, y: 11.78 * scale))
            path.addLine(to: CGPoint(x: 14.21 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 20 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 20 * scale, y: 5 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawIndentIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            // Lines
            path.move(to: CGPoint(x: 3 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 19 * scale))
            path.close()

            // Arrow
            path.move(to: CGPoint(x: 3 * scale, y: 8 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 16 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 12 * scale))
            path.close()

            path.move(to: CGPoint(x: 11 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 15 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 3 * scale))
            path.close()

            path.move(to: CGPoint(x: 11 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 7 * scale))
            path.close()

            path.move(to: CGPoint(x: 11 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 11 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawOutdentIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 11 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 15 * scale))
            path.close()

            // Arrow pointing left
            path.move(to: CGPoint(x: 3 * scale, y: 12 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 16 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 8 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 19 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 3 * scale))
            path.close()

            path.move(to: CGPoint(x: 11 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 7 * scale))
            path.close()

            path.move(to: CGPoint(x: 11 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 11 * scale, y: 11 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawAlignLeftIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 15 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 15 * scale, y: 17 * scale))
            path.close()

            path.move(to: CGPoint(x: 15 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 15 * scale, y: 9 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 11 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 19 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 3 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawAlignCenterIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 7 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 15 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 19 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 11 * scale))
            path.close()

            path.move(to: CGPoint(x: 7 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 7 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 17 * scale, y: 7 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 3 * scale))
            path.close()

            path.fill()
        }
    }

    private static func drawAlignRightIcon(color: UIColor, size: CGSize) -> UIImage {
        return drawIcon(size: size, color: color) { ctx, scale in
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 3 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 21 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 19 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 19 * scale))
            path.close()

            path.move(to: CGPoint(x: 9 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 17 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 15 * scale))
            path.addLine(to: CGPoint(x: 9 * scale, y: 15 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 13 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 11 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 11 * scale))
            path.close()

            path.move(to: CGPoint(x: 9 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 9 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 7 * scale))
            path.addLine(to: CGPoint(x: 9 * scale, y: 7 * scale))
            path.close()

            path.move(to: CGPoint(x: 3 * scale, y: 3 * scale))
            path.addLine(to: CGPoint(x: 3 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 5 * scale))
            path.addLine(to: CGPoint(x: 21 * scale, y: 3 * scale))
            path.close()

            path.fill()
        }
    }

    // MARK: - Helper

    private static func drawIcon(size: CGSize, color: UIColor, draw: (CGContext, CGFloat) -> Void) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            color.setFill()
            let scale = size.width / 24.0
            draw(context.cgContext, scale)
        }
    }
}
