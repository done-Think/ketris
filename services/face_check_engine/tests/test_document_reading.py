import unittest

import cv2
import numpy as np

from document_reading import (
    DocumentReading,
    card_detected,
    contains_in_order,
    cpf_matches,
    cpf_is_valid,
    cpfs_in,
    document_type_in,
    name_found,
    read_document,
    summarize_document,
    text_rows,
)


def blank(width=1200, height=900, value=95):
    return np.full((height, width, 3), value, np.uint8)


def with_rectangle(width, height):
    image = blank()
    left, top = (1200 - width) // 2, (900 - height) // 2
    cv2.rectangle(image, (left, top), (left + width, top + height), (225, 222, 215), -1)
    return image


class CpfTest(unittest.TestCase):
    def test_validates_check_digits(self):
        self.assertTrue(cpf_is_valid("52998224725"))
        self.assertFalse(cpf_is_valid("52998224726"))
        self.assertFalse(cpf_is_valid("00000000000"))

    def test_finds_a_valid_cpf_inside_a_line(self):
        self.assertEqual(cpfs_in(["cpf52998224725validade"]), ["52998224725"])

    def test_accepts_up_to_two_misread_punctuation_marks(self):
        self.assertTrue(contains_in_order("52998224725", "5299822247225"))
        self.assertFalse(contains_in_order("52998224725", "529928822427725"))
        self.assertFalse(contains_in_order("52998224725", "11144477735"))


class DocumentTypeTest(unittest.TestCase):
    def test_recognizes_observed_rg_title_confusions(self):
        for title in ("carteiradeidentldades", "cartelradeidentldader", "CARTEIRA DE IDENTIDADE"):
            with self.subTest(title=title):
                self.assertEqual(document_type_in([title]), "RG")

    def test_recognizes_observed_cnh_title_confusions(self):
        for title in ("carteiratnacaionaldehabilllitacao", "carteiranacionaldehabillitacao", "carteiranacionaldehabiliuitacao"):
            with self.subTest(title=title):
                self.assertEqual(document_type_in([title]), "CNH")

    def test_recognizes_the_multilingual_license_titles(self):
        for title in ('DRIVER LICENSE', 'DRIVER LICENCE', 'PERMISO DE CONDUCCION'):
            with self.subTest(title=title):
                self.assertEqual(document_type_in([title]), 'CNH')

    def test_does_not_turn_unrelated_words_into_document_titles(self):
        for title in ("habitacao", "habilidade", "identico", "nomecpf", "revistasemanal"):
            with self.subTest(title=title):
                self.assertIsNone(document_type_in([title]))

    def test_cnh_title_takes_precedence_over_identity_number_label(self):
        self.assertEqual(document_type_in(["habillitacao", "documentodeidentidade"]), "CNH")

    def test_recognizes_a_driver_license_even_with_misread_letters(self):
        self.assertEqual(document_type_in(["carteirasnaclonaldehabilitacacs"]), "CNH")

    def test_recognizes_an_identity_card(self):
        self.assertEqual(document_type_in(["carteiradeidentidade"]), "RG")

    def test_recognizes_a_migration_card(self):
        self.assertEqual(document_type_in(["registronacionalmigratorio"]), "RNE")

    def test_returns_none_when_nothing_matches(self):
        self.assertIsNone(document_type_in(["revistasemanal"]))


class NameTest(unittest.TestCase):
    def test_normalizes_the_read_text_as_well_as_the_expected_name(self):
        reading = DocumentReading(rows=["NOME JOÃO DA SILVA PEREIRA"])
        self.assertTrue(name_found(reading, "João da Silva Pereira"))

    def test_matches_ignoring_accents_and_connectors(self):
        reading = DocumentReading(rows=["joaodasilvapereira"])

        self.assertTrue(name_found(reading, "João da Silva Pereira"))

    def test_tolerates_one_misread_name_out_of_three(self):
        reading = DocumentReading(rows=["mariasliasantos"])

        self.assertTrue(name_found(reading, "Maria Silva Santos"))

    def test_does_not_match_another_person(self):
        reading = DocumentReading(rows=["mariasilvasantos"])

        self.assertFalse(name_found(reading, "João Pereira Lima"))

    def test_tolerates_one_misread_letter_in_the_name(self):
        reading = DocumentReading(rows=["lndrelopesgramatico09106n012"])

        self.assertTrue(name_found(reading, "André Lopes Gramatico"))

    def test_still_needs_the_first_name_with_at_most_one_misread_letter(self):
        reading = DocumentReading(rows=["elianacabrallopesgramatico"])

        self.assertFalse(name_found(reading, "André Lopes Gramatico"))

    def test_recognises_a_cnh_by_its_other_titles(self):
        for line in ("carthranacicconaldehabileytciodriverlicense", "driverlicenseypermisodeconduccion"):
            self.assertEqual(document_type_in([line]), "CNH")

    def test_ignores_surnames_spread_over_the_parents_rows(self):
        reading = DocumentReading(rows=["filiacao", "josesantos", "anasilva"])

        self.assertFalse(name_found(reading, "Maria Silva Santos"))

    def test_needs_the_first_name_on_the_row(self):
        reading = DocumentReading(rows=["anasilvasantos"])

        self.assertFalse(name_found(reading, "Maria Silva Santos"))

    def test_has_no_opinion_without_an_expected_name(self):
        self.assertIsNone(name_found(DocumentReading(rows=["maria"]), ""))


def box(left, top, width=200, height=40):
    return np.array(
        [[left, top], [left + width, top], [left + width, top + height], [left, top + height]],
        dtype=np.float32,
    )


class TextRowsTest(unittest.TestCase):
    def test_a_vertical_caption_cannot_join_the_holder_and_parents_names(self):
        lines = ["maria", "legenda", "silvasantos"]
        boxes = [box(100, 100), box(30, 80, 20, 300), box(100, 250)]
        rows = text_rows(lines, boxes)
        self.assertEqual(len(rows), 3)
        self.assertFalse(name_found(DocumentReading(rows=rows), "Maria Silva Santos"))

    def test_does_not_bridge_separate_fields_through_overlapping_boxes(self):
        rows = text_rows(
            ["nome", "maria", "filiacao"],
            [box(100, 100), box(100, 125), box(100, 155)],
        )
        self.assertEqual(rows, ["nome", "maria", "filiacao"])

    def test_joins_pieces_of_the_same_row_from_left_to_right(self):
        rows = text_rows(["santos", "maria", "silva"], [box(500, 100), box(100, 102), box(300, 98)])

        self.assertEqual(rows, ["mariasilvasantos"])

    def test_keeps_rows_apart_from_top_to_bottom(self):
        rows = text_rows(["52998224725", "cpf"], [box(100, 160), box(100, 100)])

        self.assertEqual(rows, ["cpf", "52998224725"])

    def test_keeps_the_given_order_without_boxes(self):
        self.assertEqual(text_rows(["b", "a"]), ["b", "a"])


class CpfFieldTest(unittest.TestCase):
    def test_reads_the_value_on_the_row_below_the_label(self):
        lines = ["cpf", "datanascimento", "52998224725", "01011990"]
        boxes = [box(100, 100), box(500, 100), box(100, 160), box(500, 160)]

        reading = read_document(lines, True, boxes)

        self.assertEqual(reading.cpfs, ["52998224725"])

    def test_ignores_a_registration_number_far_from_the_label(self):
        lines = ["registro01234567890", "filiacao", "cpf", "52998224725"]
        boxes = [box(100, 100), box(100, 200), box(100, 300), box(100, 360)]

        reading = read_document(lines, True, boxes)

        self.assertEqual(reading.cpfs, ["52998224725"])

    def test_accepts_a_label_read_as_cp(self):
        lines = ["nome", "cp", "5299822247225"]
        boxes = [box(100, 100), box(100, 160), box(100, 220)]

        summary = summarize_document(read_document(lines, True, boxes), None, "529.982.247-25")

        self.assertTrue(summary["cpfMatches"])

    def test_has_no_cpf_opinion_when_nothing_was_read(self):
        summary = summarize_document(read_document(["nome"], True), None, "529.982.247-25")

        self.assertIsNone(summary["cpfMatches"])

    def test_has_no_cpf_without_a_label(self):
        summary = summarize_document(read_document(["registro01234567890"], True), "Maria", "529.982.247-25")

        self.assertFalse(summary["cpfRead"])


class CardShapeTest(unittest.TestCase):
    def test_finds_a_low_contrast_card_without_lowering_shape_requirements(self):
        image = blank(value=210)
        cv2.rectangle(image, (200, 200), (1000, 704), (225, 225, 225), -1)
        self.assertTrue(card_detected(image))

    def test_finds_an_inclined_card(self):
        image = with_rectangle(800, 504)
        rotated = cv2.warpAffine(
            image, cv2.getRotationMatrix2D((600, 450), 10, 1),
            (1200, 900), borderValue=(95, 95, 95),
        )
        self.assertTrue(card_detected(rotated))

    def test_does_not_invent_a_card_when_it_has_no_visible_boundary(self):
        self.assertFalse(card_detected(blank(value=225)))

    def test_ignores_a_large_oval(self):
        image = blank()
        cv2.ellipse(image, (600, 450), (400, 252), 0, 0, 360, (225, 225, 225), -1)
        self.assertFalse(card_detected(image))

    def test_ignores_a_low_contrast_square(self):
        image = blank(value=210)
        cv2.rectangle(image, (300, 150), (900, 750), (225, 225, 225), -1)
        self.assertFalse(card_detected(image))

    def test_ignores_the_image_border(self):
        image = blank()
        cv2.rectangle(image, (2, 2), (1197, 897), (225, 225, 225), 3)
        self.assertFalse(card_detected(image))

    def test_finds_a_card_shaped_rectangle(self):
        self.assertTrue(card_detected(with_rectangle(800, 504)))

    def test_ignores_a_square(self):
        self.assertFalse(card_detected(with_rectangle(600, 600)))

    def test_ignores_an_empty_photo(self):
        self.assertFalse(card_detected(blank()))


class SummaryTest(unittest.TestCase):
    def test_a_different_valid_cpf_is_not_corrected_towards_the_expected_one(self):
        reading = read_document(["cpf", "52998224725"], True)
        self.assertTrue(cpf_is_valid("52998225705"))
        self.assertFalse(cpf_matches(reading, "52998225705"))
        summary = summarize_document(reading, "Maria Silva Santos", "52998225705")
        self.assertTrue(summary["cpfRead"])
        self.assertFalse(summary["cpfMatches"])

    def test_unverified_numeric_noise_is_not_reported_as_a_different_cpf(self):
        reading = read_document(["cpf", "12345678901"], True)
        summary = summarize_document(reading, "Maria Silva Santos", "52998224725")
        self.assertFalse(summary["cpfRead"])
        self.assertIsNone(summary["cpfMatches"])

    def test_compares_with_the_expected_person(self):
        reading = read_document(["carteiranacionaldehabilitacao", "mariasilvasantos", "cpf", "52998224725"], True)

        summary = summarize_document(reading, "Maria Silva Santos", "529.982.247-25")

        self.assertEqual(
            summary,
            {
                "cardDetected": True,
                "documentType": "CNH",
                "cpfRead": True,
                "cpfMatches": True,
                "nameFound": True,
            },
        )

    def test_finds_the_expected_cpf_with_one_misread_digit_on_a_row_without_label(self):
        reading = DocumentReading(rows=["1395436081607880750"])

        self.assertTrue(cpf_matches(reading, "139.543.606-16"))

    def test_finds_the_expected_cpf_with_a_missing_and_a_swapped_digit(self):
        reading = DocumentReading(rows=["x1954860616x"])

        self.assertTrue(cpf_matches(reading, "139.543.606-16"))

    def test_does_not_accept_another_cpf_with_three_differences(self):
        reading = DocumentReading(rows=["529982247251"])

        self.assertIsNone(cpf_matches(reading, "529.982.000-25"))

    def test_rejects_a_labelled_cpf_that_is_far_from_the_expected(self):
        reading = read_document(["cpf", "52998224725"], True, [box(100, 100), box(100, 160)])

        self.assertFalse(cpf_matches(reading, "139.543.606-16"))

    def test_uses_the_narrow_rereads_of_number_boxes(self):
        reading = DocumentReading(rows=["1395310561"], number_rereads=["1395431606161"])

        self.assertTrue(cpf_matches(reading, "139.543.606-16"))

    def test_has_no_cpf_opinion_without_an_expected_cpf(self):
        summary = summarize_document(read_document(["maria"], False), "Maria", None)

        self.assertIsNone(summary["cpfMatches"])


if __name__ == "__main__":
    unittest.main()
