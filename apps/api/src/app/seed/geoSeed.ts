import * as dotenv from "dotenv";
import { prisma } from "../shared/prisma";
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// STATIC SEED DATA
// Generated from: github.com/ifahimreza/bangladesh-geojson
// UUIDs are deterministic (uuid v5) — safe to re-run without duplicates
// ─────────────────────────────────────────────────────────────────────────────

const divisions = [
  { id: "70e2930b-b475-5dba-8c84-2714840acead", name: "Barishal" },
  { id: "99defb7b-5e29-5e3c-bbda-f7a0807e9010", name: "Chattogram" },
  { id: "6ec60ece-9563-5152-91db-d7e2df666a29", name: "Dhaka" },
  { id: "2b848bc2-e400-5152-9494-985a6854b526", name: "Khulna" },
  { id: "009118e2-f4ac-5ba0-8194-d4bce095a384", name: "Rajshahi" },
  { id: "2d3eee30-f4bf-5f98-9524-43d731180e81", name: "Rangpur" },
  { id: "0c07e8b8-6c24-5792-9d6a-81b21756a1c2", name: "Sylhet" },
  { id: "b1f57d9d-d2cf-582c-a10c-87024891ec9b", name: "Mymensingh" },
];

const districts = [
  {
    id: "71669645-508c-56ba-bf5d-71cc670dd0ec",
    name: "Dhaka",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "2cba380e-0b08-5360-ab67-b59d8f43532d",
    name: "Faridpur",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
    name: "Gazipur",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
    name: "Gopalganj",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "e315523d-0bbe-51e2-8642-311ca4974e2e",
    name: "Jamalpur",
    divisionId: "b1f57d9d-d2cf-582c-a10c-87024891ec9b",
  },
  {
    id: "14910777-3c2e-5dfe-b179-f68080bcb290",
    name: "Kishoreganj",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "ed13f145-6c25-5865-8184-a4d321e14c2f",
    name: "Madaripur",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "6bb1699e-f55e-5f55-ae65-513844707472",
    name: "Manikganj",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
    name: "Munshiganj",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
    name: "Mymensingh",
    divisionId: "b1f57d9d-d2cf-582c-a10c-87024891ec9b",
  },
  {
    id: "60afa2bd-2d22-5413-8514-111f643faf56",
    name: "Narayanganj",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "697dcc4c-2f06-5732-b923-6984a98dd832",
    name: "Narsingdi",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
    name: "Netrokona",
    divisionId: "b1f57d9d-d2cf-582c-a10c-87024891ec9b",
  },
  {
    id: "0600b095-aacc-5eca-81f3-e20b470163f5",
    name: "Rajbari",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
    name: "Shariatpur",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
    name: "Sherpur",
    divisionId: "b1f57d9d-d2cf-582c-a10c-87024891ec9b",
  },
  {
    id: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
    name: "Tangail",
    divisionId: "6ec60ece-9563-5152-91db-d7e2df666a29",
  },
  {
    id: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
    name: "Bogura",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "60f402cf-619d-5679-9d0c-421a195a87c4",
    name: "Joypurhat",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "f1228862-fb71-5a41-a46c-18f78c032a63",
    name: "Naogaon",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
    name: "Natore",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
    name: "Nawabganj",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
    name: "Pabna",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
    name: "Rajshahi",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "584fb1e3-24d7-5192-b701-fc37e65231a8",
    name: "Sirajgonj",
    divisionId: "009118e2-f4ac-5ba0-8194-d4bce095a384",
  },
  {
    id: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
    name: "Dinajpur",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
    name: "Gaibandha",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "9373462e-3329-5cfb-8f32-4cc180181e36",
    name: "Kurigram",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
    name: "Lalmonirhat",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
    name: "Nilphamari",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
    name: "Panchagarh",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
    name: "Rangpur",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
    name: "Thakurgaon",
    divisionId: "2d3eee30-f4bf-5f98-9524-43d731180e81",
  },
  {
    id: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
    name: "Barguna",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
    name: "Barishal",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
    name: "Bhola",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "533cb39a-5d2f-51c8-9956-5a2d61049e96",
    name: "Jhalokati",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
    name: "Patuakhali",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "9f96e828-d528-5b83-9841-43807d0e4373",
    name: "Pirojpur",
    divisionId: "70e2930b-b475-5dba-8c84-2714840acead",
  },
  {
    id: "c76da675-41d8-536f-993f-fc5244c63a5c",
    name: "Bandarban",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "8acb58ea-7330-5a30-9a13-374130d62995",
    name: "Brahmanbaria",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
    name: "Chandpur",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
    name: "Chattogram",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
    name: "Cumilla",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
    name: "Cox's Bazar",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "3b3119c5-36c3-5626-a682-5dc45b53213c",
    name: "Feni",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "2413b739-970e-5af2-9c76-21e0b2815d58",
    name: "Khagrachari",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
    name: "Lakshmipur",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
    name: "Noakhali",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
    name: "Rangamati",
    divisionId: "99defb7b-5e29-5e3c-bbda-f7a0807e9010",
  },
  {
    id: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
    name: "Habiganj",
    divisionId: "0c07e8b8-6c24-5792-9d6a-81b21756a1c2",
  },
  {
    id: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
    name: "Maulvibazar",
    divisionId: "0c07e8b8-6c24-5792-9d6a-81b21756a1c2",
  },
  {
    id: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
    name: "Sunamganj",
    divisionId: "0c07e8b8-6c24-5792-9d6a-81b21756a1c2",
  },
  {
    id: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
    name: "Sylhet",
    divisionId: "0c07e8b8-6c24-5792-9d6a-81b21756a1c2",
  },
  {
    id: "7861822c-1cd1-58df-85c4-cba21b66356b",
    name: "Bagerhat",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "b0dc78b3-180d-5b58-880d-55a76fd47ee4",
    name: "Chuadanga",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "370d46ca-967d-5046-bf64-4bc29013844b",
    name: "Jashore",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
    name: "Jhenaidah",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
    name: "Khulna",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
    name: "Kushtia",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "219bfd2f-14fd-5929-84c7-3d111d04b2a7",
    name: "Magura",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "ec202906-8b74-5f41-a5e6-44f017cc7e65",
    name: "Meherpur",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "f089aa9e-0c1a-54b5-8081-252b768a3e7f",
    name: "Narail",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
  {
    id: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
    name: "Satkhira",
    divisionId: "2b848bc2-e400-5152-9494-985a6854b526",
  },
];

const upazilas = [
  {
    id: "62dae834-affd-5ec4-8c04-7c9ee31b0ee6",
    name: "Amtali",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "1bfef897-3d5d-597b-8a95-38ae7591cfbe",
    name: "Bamna",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "c8c09586-44c9-5efc-8407-80d5b364cab1",
    name: "Barguna Sadar",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "a835cc68-010f-50b9-be77-aba0b921b8e5",
    name: "Betagi",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "5cb04369-3e7a-5a53-a2fa-dd49562faf71",
    name: "Patharghata",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "37f8e4b8-972c-557e-b800-f2157eca4c37",
    name: "Taltali",
    districtId: "bc0e5af1-1480-5bb0-b857-67099f3fc5dc",
  },
  {
    id: "8e1f3330-3797-5873-aeeb-611a033d7e7b",
    name: "Muladi",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "08f50b5c-d7de-5dc0-8b64-bab0fa167819",
    name: "Babuganj",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "aa08747c-4bc2-56af-afad-a5d28d917f38",
    name: "Agailjhara",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "d95de1fd-bca6-56f4-a991-f6ec811e3fea",
    name: "Barisal Sadar",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "9bda4f3d-b030-5aba-b3a1-0932be93b8ac",
    name: "Bakerganj",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "0f0df57e-37c4-5416-b468-eded9da8a2f1",
    name: "Banaripara",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "80608a55-f8d8-51d0-b80e-4cfddc0e9575",
    name: "Gaurnadi",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "cf268063-751e-5281-83ff-a15375007409",
    name: "Hizla",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "3537d30b-a785-5b29-bd34-3e2c569acf9f",
    name: "Mehendiganj",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "c4b0a513-6591-540d-be04-ae5d3591ad5e",
    name: "Wazirpur",
    districtId: "90f13b95-cf2e-55e5-8918-f0f70b2dffdb",
  },
  {
    id: "18aabf4c-ac42-5960-bd13-74f43c5d8815",
    name: "Bhola Sadar",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "573bff83-603c-57fc-9d23-6a780d468287",
    name: "Burhanuddin",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "a4306c87-2625-5cce-8fce-a77ac10191e3",
    name: "Char Fasson",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "57f87b32-1301-5f30-941c-a6f715b2ab02",
    name: "Daulatkhan",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "a4b0b132-c41d-5fd8-9782-d2aec9c0fac0",
    name: "Lalmohan",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "2f91e7d3-dcb3-5d17-ae20-548cba9043e3",
    name: "Manpura",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "797032b5-3224-5e50-98d9-c6ad8f2ece36",
    name: "Tazumuddin",
    districtId: "ac5edeb1-6b69-5052-bf8b-dbe55063fa9f",
  },
  {
    id: "ee857dfa-ad04-563f-a971-93cdace20360",
    name: "Jhalokati Sadar",
    districtId: "533cb39a-5d2f-51c8-9956-5a2d61049e96",
  },
  {
    id: "9ded8382-517d-5b96-881d-b00d78a9c6c2",
    name: "Kathalia",
    districtId: "533cb39a-5d2f-51c8-9956-5a2d61049e96",
  },
  {
    id: "6e377ea6-7b0b-5878-85de-3a9295d27513",
    name: "Nalchity",
    districtId: "533cb39a-5d2f-51c8-9956-5a2d61049e96",
  },
  {
    id: "5a5ca4cc-cd2c-5b62-a7b5-c3c950a83f2c",
    name: "Rajapur",
    districtId: "533cb39a-5d2f-51c8-9956-5a2d61049e96",
  },
  {
    id: "e8444f47-8f46-5186-a701-b4426d477cae",
    name: "Bauphal",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "c3964cb8-73b9-5101-ab15-e0b039b76811",
    name: "Dashmina",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "6881086f-b237-5f48-94db-0ae362055b7c",
    name: "Galachipa",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "3ce9b2a9-9fea-5610-a272-09aec0dbb734",
    name: "Kalapara",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "33c20223-4ffb-5ffc-bb00-f61497824d6e",
    name: "Mirzaganj",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "b70b543b-9253-571d-ab5a-0dec952e411d",
    name: "Patuakhali Sadar",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "f0eb5a50-b39e-519b-bb4b-f50a30264d37",
    name: "Dumki",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "120b5489-4d0e-508f-abd0-8b26549f5adc",
    name: "Rangabali",
    districtId: "2086f099-a40f-5e8c-b2d3-61fbf841b211",
  },
  {
    id: "2d8078cf-ff72-5a92-bbc9-4c3450f7ed2e",
    name: "Bhandaria",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "da47a165-0398-5ca0-adf7-6854178033f5",
    name: "Kaukhali",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "6a5b9d67-7380-53c3-a4af-36db1f11707f",
    name: "Mathbaria",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "3dea862c-0e1c-5f34-8f6a-3ee26318077d",
    name: "Nazirpur",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "a19d6e5e-43a4-559e-94bb-d4942f0c6595",
    name: "Nesarabad",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "ce938747-6cf0-5382-bcfe-7f47974816b5",
    name: "Pirojpur Sadar",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "6b14bf5e-80f0-59ea-90fd-d1be40477b2b",
    name: "Zianagar",
    districtId: "9f96e828-d528-5b83-9841-43807d0e4373",
  },
  {
    id: "bea20b2c-50e8-599d-9668-3cee83e3ba0c",
    name: "Bandarban Sadar",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "33c6f800-27db-5dcb-b444-0fd52aad0934",
    name: "Thanchi",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "524c6082-3949-5180-8121-e067e75992ba",
    name: "Lama",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "9f54e3ad-4267-5dc5-8e7e-44220fc58027",
    name: "Naikhongchhari",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "fa6b7cda-5cc9-5151-bc26-9de2c4fdd0f6",
    name: "Ali kadam",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "daad767b-1216-5ae0-8fd9-d683bcca59c8",
    name: "Rowangchhari",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "49615e60-e1c1-5c2f-a54d-06f746b4ad90",
    name: "Ruma",
    districtId: "c76da675-41d8-536f-993f-fc5244c63a5c",
  },
  {
    id: "ff74353a-69ec-5a41-8d94-2c0a8b774513",
    name: "Brahmanbaria Sadar",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "9fa64a86-7de3-5179-8df5-01610cfe41a4",
    name: "Ashuganj",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "c859063a-8c4f-58a2-9761-c28e9ee58776",
    name: "Nasirnagar",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "e210603b-be9b-522c-8e3e-9c744ca8f194",
    name: "Nabinagar",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "f92628de-5b1b-5557-9138-ef968db7b204",
    name: "Sarail",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "aea8b64f-6405-5b4f-9fe8-6e81beef3e6c",
    name: "Shahbazpur Town",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "bc4b714f-4f4b-5650-88f4-ff19996258a2",
    name: "Kasba",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "dca24528-2a55-583e-add9-d1e22d37a9be",
    name: "Akhaura",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "372fdade-a834-5ae7-be84-a88deabb7f70",
    name: "Bancharampur",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "ebb99ebf-44db-53c0-b38a-2250f84357e7",
    name: "Bijoynagar",
    districtId: "8acb58ea-7330-5a30-9a13-374130d62995",
  },
  {
    id: "902afbe4-cd6a-5403-9e29-06501d8022d3",
    name: "Chandpur Sadar",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "2749d0f0-8049-5e9a-a89b-67eb1e6b37b4",
    name: "Faridganj",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "ec22fcbd-b4a9-5e54-80fe-41d29f0e7e21",
    name: "Haimchar",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "a62d93a0-0e6a-56cc-949a-32cdb7bf5532",
    name: "Haziganj",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "9f8465bb-489f-59c3-8a74-0bd82da5e275",
    name: "Kachua",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "57838e46-03a3-55fe-85b5-37185715bba0",
    name: "Matlab Uttar",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "d6fddd7e-3fa2-59ac-980a-7b4cc14f0499",
    name: "Matlab Dakkhin",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "f2936fe9-2248-5cae-afae-7038bff0fd7f",
    name: "Shahrasti",
    districtId: "e64d3a9a-fa87-5f4a-820d-9637aadddd1d",
  },
  {
    id: "638cfe18-1a66-5f8e-8292-3cd58771f947",
    name: "Anwara",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "27308506-7c76-5762-9e32-8c441bd7f0be",
    name: "Banshkhali",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "93696d06-9de8-5dff-b1f6-c1e7d838edcf",
    name: "Boalkhali",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "7377078c-f432-5276-9c4f-290973d6e877",
    name: "Chandanaish",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "fb867e4b-51e4-5c03-8087-3404ab794c44",
    name: "Fatikchhari",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "620bcee5-5b85-5910-bc5b-ad933203dd2d",
    name: "Hathazari",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "78e8b23d-a0af-5f23-a215-374ff7229ad9",
    name: "Lohagara",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "d4b45901-d4ec-56b5-aef8-7e690b99def0",
    name: "Mirsharai",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "448cf7ea-1012-5c12-b9d6-f4e4005f1e1b",
    name: "Patiya",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "7d7f748e-0faa-58b8-bb94-e5e31dafd40b",
    name: "Rangunia",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "f31b3d13-329d-59c1-94d2-dc44ad998b72",
    name: "Raozan",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "0c83a259-bffe-5df4-b638-d77d04f1ab74",
    name: "Sandwip",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "39712e9c-ab8b-5aba-8a7f-f907e0ef000c",
    name: "Satkania",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "603cc6fd-a5bd-5267-9ee2-7eefcad95358",
    name: "Sitakunda",
    districtId: "03e477c0-9011-51e5-97f4-8afabb3c4a24",
  },
  {
    id: "cae6198a-b424-5486-b2d8-8f044faf2279",
    name: "Barura",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "6d9da0c0-1de4-5a65-b268-8efba379ceff",
    name: "Brahmanpara",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "cf15a5cb-b271-53f6-8d01-a41218e66279",
    name: "Burichong",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "35ebe6b0-ae97-5bfc-8aa0-426ffb3fb0e1",
    name: "Chandina",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "3e282b7a-9af9-566b-af73-cff1ab51add9",
    name: "Chauddagram",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "55cc06fd-0ab8-53a7-ae2e-53e67c816362",
    name: "Daudkandi",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "47f23146-4fb3-529e-b424-c02d1c9b10bf",
    name: "Debidwar",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "cfc617c5-b2e1-5fa1-ac4a-4b2f7023d643",
    name: "Homna",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "ba4a8114-76da-5ce1-bb2f-c765d56dcca7",
    name: "Comilla Sadar",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "c0ef6cd3-3e6d-58c7-aa35-3eae4586e2eb",
    name: "Laksam",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "4f09ae24-62db-55bc-8e76-0e3c8f63775a",
    name: "Monohorgonj",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "afed2b81-4468-5159-b36d-eff4d4142bd2",
    name: "Meghna",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "5dd00598-7ce6-5a59-8c08-d6aac1610bb8",
    name: "Muradnagar",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "ba06383a-10e7-51a8-b65e-54f0cb35edce",
    name: "Nangalkot",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "04e39bfe-3261-55cc-b704-203090cfe55e",
    name: "Comilla Sadar South",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "a1d28de3-3a48-57d3-b352-b69559506d20",
    name: "Titas",
    districtId: "8d308912-7b4d-5a08-8753-e99b600c7bfc",
  },
  {
    id: "a04bf0b3-6451-5839-b5d2-de908c8817d6",
    name: "Chakaria",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "1c575606-0898-5dcc-8bb5-bef3345bbef6",
    name: "Cox's Bazar Sadar",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "da94ea65-bff4-5bc1-949b-c880cfa7eea8",
    name: "Kutubdia",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "a66557de-1fe5-5bc5-b32d-6567a2097a6d",
    name: "Maheshkhali",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "538aab43-c195-5fee-9908-4208e101a121",
    name: "Ramu",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "91564b5f-a061-5d2a-b175-af1f819a855d",
    name: "Teknaf",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "858e24a8-b152-5c83-8902-a4bcdf5415b4",
    name: "Ukhia",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "8b750ce4-b473-5a94-8c71-94c1d3e82661",
    name: "Pekua",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "263034ec-4941-5e0b-b1f0-4c3361ab86b2",
    name: "Feni Sadar",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "6c83f3d0-6c33-5131-93b6-6038e68b11e6",
    name: "Chagalnaiya",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "3b773ec7-2523-5cf7-aa22-73039bfa8bcb",
    name: "Daganbhyan",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "eb313b3e-9598-566b-aae8-7dc033414744",
    name: "Parshuram",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "25bfcf2d-65e9-53b0-99b4-96f9a7282660",
    name: "Fhulgazi",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "f12d325f-1551-502d-999f-398dc058dea8",
    name: "Sonagazi",
    districtId: "3b3119c5-36c3-5626-a682-5dc45b53213c",
  },
  {
    id: "9087c3b6-cdb1-5ffe-9f22-9e8f10496c44",
    name: "Dighinala",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "24cc1c59-6793-51a0-95b7-682ca43e7abe",
    name: "Khagrachhari",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "c64cc114-112a-5028-9077-88b34067da4e",
    name: "Lakshmichhari",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "63b37ac4-7161-5ee1-8f5d-4cc9cf1372cd",
    name: "Mahalchhari",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "7f6a87ce-bf77-52b1-aeed-226990cc0008",
    name: "Manikchhari",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "7a920627-c66d-535f-87d0-6e049330ffc3",
    name: "Matiranga",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "d1bebd8d-f359-5633-ae46-d6219b0d5038",
    name: "Panchhari",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "953a69e1-3644-58cb-b7b7-e396aa3be2b5",
    name: "Ramgarh",
    districtId: "2413b739-970e-5af2-9c76-21e0b2815d58",
  },
  {
    id: "fd70bcf7-916a-5907-aacf-d3fa5959a993",
    name: "Lakshmipur Sadar",
    districtId: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
  },
  {
    id: "4e360bef-87ad-53cb-877a-27e0b5ff5699",
    name: "Raipur",
    districtId: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
  },
  {
    id: "bf247ff8-3533-58c9-a28b-d27bca176cfd",
    name: "Ramganj",
    districtId: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
  },
  {
    id: "ef70337d-9c65-5343-9de6-d985529eb052",
    name: "Ramgati",
    districtId: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
  },
  {
    id: "81299ca5-8b4b-52ae-9534-7610971028f6",
    name: "Komol Nagar",
    districtId: "6a36aba6-4963-593b-89d6-a3b1b906abf2",
  },
  {
    id: "a085c5b3-4e8b-582a-9808-b75ade5bc9d6",
    name: "Noakhali Sadar",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "e3d39052-78c7-514a-b496-7b3161c4db2c",
    name: "Begumganj",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "0fb76705-b7ed-5a33-be81-6f1da6461f52",
    name: "Chatkhil",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "6c9cdbfa-8af8-5334-8517-14227d14f3e2",
    name: "Companyganj",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "c8e3b308-4d54-56db-ab1e-3f7405e675a7",
    name: "Shenbag",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "68777f88-a4bb-5000-afcf-64b6929587fd",
    name: "Hatia",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "440cd092-5ae9-5fe6-b1b0-ddd3d71cfb28",
    name: "Kobirhat",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "e7493231-58dc-5254-91eb-f420e6685f72",
    name: "Sonaimuri",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "e9ed9405-6744-51ed-b13b-7fc2d55e3fde",
    name: "Suborno Char",
    districtId: "7433932a-5a5e-5de6-a940-f77fa4cbc3c5",
  },
  {
    id: "94476cc2-3aa4-57a3-8cb5-853f7f9b2630",
    name: "Rangamati Sadar",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "176bb227-4a85-54e3-a9f4-12d1aca90154",
    name: "Belaichhari",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "4dc385f2-f5ed-5648-8658-df2a7da28bba",
    name: "Bagaichhari",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "affd50a9-8c59-5b47-9ec5-ff370587c03a",
    name: "Barkal",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "a9c84857-df1d-5923-b981-b1d8d5f5c57d",
    name: "Juraichhari",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "52f433c0-08d7-59da-8017-19d7588ca895",
    name: "Rajasthali",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "f43579ce-7cbf-5987-b835-3ab744e36ff2",
    name: "Kaptai",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "2b63d9e2-e645-53a5-88d5-8b0c4ff6dd85",
    name: "Langadu",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "69b81cc6-7e1c-584c-8eb2-ff0323d9d53f",
    name: "Nannerchar",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "e3f123a8-f462-5c1f-8d8e-ba8ad8da3df0",
    name: "Kaukhali",
    districtId: "b46ba0d9-6a5a-51e7-8aff-66d62fda594e",
  },
  {
    id: "24446943-47c7-556f-a529-29caf97a847e",
    name: "Dhamrai",
    districtId: "71669645-508c-56ba-bf5d-71cc670dd0ec",
  },
  {
    id: "a27bff02-b837-5684-a15e-509c700c6fdc",
    name: "Dohar",
    districtId: "71669645-508c-56ba-bf5d-71cc670dd0ec",
  },
  {
    id: "8fd7bb0f-c784-57fe-8621-9c4f9285516d",
    name: "Keraniganj",
    districtId: "71669645-508c-56ba-bf5d-71cc670dd0ec",
  },
  {
    id: "1bb76b25-758d-57d3-af3b-060ffc832cd2",
    name: "Nawabganj",
    districtId: "71669645-508c-56ba-bf5d-71cc670dd0ec",
  },
  {
    id: "25cc5e21-4151-59f2-b1ed-908f6519a7dd",
    name: "Savar",
    districtId: "71669645-508c-56ba-bf5d-71cc670dd0ec",
  },
  {
    id: "218b949e-30e3-56e1-adaf-b48bd280bac7",
    name: "Faridpur Sadar",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "364c6811-d958-59a5-bd6e-9593bfd4a312",
    name: "Boalmari",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "a40691ad-7369-597d-b599-6335ad661aa8",
    name: "Alfadanga",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "5b19d7c5-57ad-51ed-9272-f7ad41a33b92",
    name: "Madhukhali",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "ba602712-b375-58bc-8405-1f23cb48782d",
    name: "Bhanga",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "15b3a13c-44ac-5912-a394-5c550843bce6",
    name: "Nagarkanda",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "1dd9dd98-dff7-5fbf-ae66-59b42488086a",
    name: "Charbhadrasan",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "6eee3749-ce4d-5805-ba4b-6e6cbbd070f6",
    name: "Sadarpur",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "e7f8b740-a159-5dde-96cb-e91a15ece4bf",
    name: "Shaltha",
    districtId: "2cba380e-0b08-5360-ab67-b59d8f43532d",
  },
  {
    id: "9f880752-968e-504d-bc18-a55865df9b5f",
    name: "Gazipur Sadar-Joydebpur",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "89456ea6-b627-5b1b-8a17-7ecf05f6f5ae",
    name: "Kaliakior",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "cf2c1d6e-3215-5fb3-bf0f-b7c304deef54",
    name: "Kapasia",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "d251b144-82c3-5ae7-8bc4-3cbcda7e0695",
    name: "Sripur",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "e9ced2f6-064c-5c6c-bdd9-519b7e116e97",
    name: "Kaliganj",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "3c4f9f04-fb28-5e57-a693-7ee22ba0d453",
    name: "Tongi",
    districtId: "34122ff0-ab48-57f1-ac1c-c28eb37fe335",
  },
  {
    id: "b60470cd-64c3-548f-ac10-a1907a5aa817",
    name: "Gopalganj Sadar",
    districtId: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
  },
  {
    id: "34257c6c-dad8-50c4-a727-049ccb7e25da",
    name: "Kashiani",
    districtId: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
  },
  {
    id: "0249aca3-bc61-53a4-b66a-10a9fe201a6c",
    name: "Kotalipara",
    districtId: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
  },
  {
    id: "56279240-38bb-531a-8756-adc300dff74c",
    name: "Muksudpur",
    districtId: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
  },
  {
    id: "c2f095a9-afe9-5d1e-8608-20ba18c5f60a",
    name: "Tungipara",
    districtId: "e2d8c044-1e74-5405-99c8-9baaa4c75fcf",
  },
  {
    id: "21047e95-6217-53fb-86ce-ae615dba900b",
    name: "Dewanganj",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "3797a75b-6595-5822-b1b9-64b29007018e",
    name: "Baksiganj",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "13039fdf-58a0-54fd-8a5d-5a7e3f227fb9",
    name: "Islampur",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "4f0ca355-ab6a-556e-bcec-7cf5f254e807",
    name: "Jamalpur Sadar",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "0b809bf7-e116-53e5-8905-dc36e38fce8b",
    name: "Madarganj",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "3ee70311-21aa-5f0a-a4b1-809a2a177d0c",
    name: "Melandaha",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "f82cf782-9e5a-597e-8705-3bef30b72136",
    name: "Sarishabari",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "36e3208b-0e41-54f0-bcd4-a70bfd3bcde0",
    name: "Narundi Police I.C",
    districtId: "e315523d-0bbe-51e2-8642-311ca4974e2e",
  },
  {
    id: "e1baf069-3947-5a42-9b8e-fe96c038ff86",
    name: "Astagram",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "3171ba83-ac54-5c22-8e04-47fa99aa7ac1",
    name: "Bajitpur",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "00698f17-76cc-5db2-9b48-2e902e272480",
    name: "Bhairab",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "b7c7c4b3-ad7f-5fea-88b7-78b998010056",
    name: "Hossainpur",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "f0faae5c-e6bc-55d9-8ff2-34a02f5cddad",
    name: "Itna",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "c79112c0-4fa4-5aa2-96cb-9b6f354a3070",
    name: "Karimganj",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "0f24d57c-a814-51ef-9992-3062e7897bc6",
    name: "Katiadi",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "3b304c8a-7399-5b88-9699-63b560f474e5",
    name: "Kishoreganj Sadar",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "2bb95d3d-c725-5ada-aff2-2516351eaf16",
    name: "Kuliarchar",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "15d26ab6-97d1-5fe9-8478-2e368345fdd5",
    name: "Mithamain",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "5409e137-39f5-5cca-b614-10cb36a75c98",
    name: "Nikli",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "78cd527d-559d-5c05-bcf4-dfc5f0367772",
    name: "Pakundia",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "69e3f99f-9814-50cd-a7a0-de6bffa5196a",
    name: "Tarail",
    districtId: "14910777-3c2e-5dfe-b179-f68080bcb290",
  },
  {
    id: "3c7f3895-f36d-5268-a80a-4db9039b0247",
    name: "Madaripur Sadar",
    districtId: "ed13f145-6c25-5865-8184-a4d321e14c2f",
  },
  {
    id: "4a6036f5-3c6f-597d-b15c-c072a8307663",
    name: "Kalkini",
    districtId: "ed13f145-6c25-5865-8184-a4d321e14c2f",
  },
  {
    id: "03ae9cf9-45ca-5d2c-adf0-c289815da6f5",
    name: "Rajoir",
    districtId: "ed13f145-6c25-5865-8184-a4d321e14c2f",
  },
  {
    id: "ba8fd6e0-b4f0-57a0-af5e-8af3d713cbc9",
    name: "Shibchar",
    districtId: "ed13f145-6c25-5865-8184-a4d321e14c2f",
  },
  {
    id: "f6324667-6a9f-5bd5-a9cd-77bc2871a91b",
    name: "Manikganj Sadar",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "69d69a7b-f4e1-573e-8d8e-bc141ed10d47",
    name: "Singair",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "89c81b49-4cde-505f-9fba-371c5283b3a2",
    name: "Shibalaya",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "44546492-e0a6-5f5d-80ec-cb4528afdbeb",
    name: "Saturia",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "8b02ffa0-3cdb-5767-a52c-bc2cde87cee5",
    name: "Harirampur",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "121a03aa-e885-5bb3-bca4-99e9f063f223",
    name: "Ghior",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "ea2546a2-62a2-5a68-87fb-1f9555782bb9",
    name: "Daulatpur",
    districtId: "6bb1699e-f55e-5f55-ae65-513844707472",
  },
  {
    id: "77383282-2200-5ffc-aaaf-dbf9926114d1",
    name: "Lohajang",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "58f1c485-5c1d-568f-9b95-2f29c29bc469",
    name: "Sreenagar",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "361d3271-76bd-5dee-bc82-ebe504344cc8",
    name: "Munshiganj Sadar",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "b7ee1849-d36e-5757-9eb3-fd2cde7e004c",
    name: "Sirajdikhan",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "556faf7e-d0da-52ec-b216-a5949d8e8c34",
    name: "Tongibari",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "6980e65a-21a1-5413-b24d-7924f4956152",
    name: "Gazaria",
    districtId: "ab1a25db-fcd3-5b55-aca1-e7e57e665f41",
  },
  {
    id: "48bd54cd-3423-57af-ae5a-6c8c3464df48",
    name: "Bhaluka",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "06896d00-eda0-5db0-a639-220c314902aa",
    name: "Trishal",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "3aa9e08f-77b6-593a-b2b5-e309e6784d08",
    name: "Haluaghat",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "63134dbd-d89e-5149-b5a7-c1af8acbbc94",
    name: "Muktagachha",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "a4671887-11dd-5848-a2d1-71524bf727df",
    name: "Dhobaura",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "29124047-f76a-5617-9578-60a95b9c1249",
    name: "Fulbaria",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "a7d05b0e-caaa-591a-8e1e-9064af69be04",
    name: "Gaffargaon",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "adbed53e-4942-50a3-aa8f-f80b298dfdcc",
    name: "Gauripur",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "294419fe-2a8a-5e29-89ee-fec6e52b12b1",
    name: "Ishwarganj",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "674f503b-042e-554a-be5b-641512113938",
    name: "Mymensingh Sadar",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "74c6a283-a86b-583e-8127-d85266519b65",
    name: "Nandail",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "5f350cc9-58b9-5027-a372-5feec24c4da1",
    name: "Phulpur",
    districtId: "11cbc7cc-ecfe-5abb-8e55-7048ac6aa315",
  },
  {
    id: "f49517b1-2d55-5406-995f-d34981df081b",
    name: "Araihazar",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "5610b05b-6fe2-5ac8-ac6b-43a8d4866c07",
    name: "Sonargaon",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "c7ee00c5-f856-5dcb-bfc6-9fdbdd030463",
    name: "Bandar",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "be2685e0-f8f8-59c4-b847-5916f7433342",
    name: "Naryanganj Sadar",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "664c1ec2-1e95-5633-aa02-4a7e42bb59fe",
    name: "Rupganj",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "3295c405-9564-5b85-bcd3-8c21595de360",
    name: "Siddirgonj",
    districtId: "60afa2bd-2d22-5413-8514-111f643faf56",
  },
  {
    id: "715990cf-7199-5f02-953e-60793fd05d52",
    name: "Belabo",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "643eaa9d-c36f-5558-b316-717027a77248",
    name: "Monohardi",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "afa150cd-8b97-5111-9c65-1cd431207367",
    name: "Narsingdi Sadar",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "15d25c31-dba5-59f8-ae89-cc97f404c8ca",
    name: "Palash",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "5577205f-152d-5687-bfe5-91e8ee9230c2",
    name: "Raipura, Narsingdi",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "2a445942-ab11-5f15-bcbc-8c5ffb382e47",
    name: "Shibpur",
    districtId: "697dcc4c-2f06-5732-b923-6984a98dd832",
  },
  {
    id: "92fea677-6b4c-559a-92d3-f82df63b3eeb",
    name: "Kendua Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "eb7704d0-4537-5585-99d1-01c0700decf3",
    name: "Atpara Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "0840abee-9380-5eb4-9466-9ef74c3f8424",
    name: "Barhatta Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "4ddf9e74-67c8-56ad-87b1-b40e3b31c5aa",
    name: "Durgapur Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "25ba591c-40d8-5cb0-acba-d845c385ff5a",
    name: "Kalmakanda Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "10eec8e0-fbaf-55d3-9bd4-c9d1179e997f",
    name: "Madan Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "ed11f610-378a-5919-a6b7-ebdbbbbc43ee",
    name: "Mohanganj Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "70497344-0a65-55c7-b330-9da5ff608da2",
    name: "Netrakona-S Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "292cfeae-daad-5a3c-a559-170ab53c2f51",
    name: "Purbadhala Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "c8b317d5-df57-5767-9ebf-13ec11b82222",
    name: "Khaliajuri Upazilla",
    districtId: "d2bdfd6a-fd4e-511e-9546-6d4ad647a3b6",
  },
  {
    id: "a11054db-fa73-5c0a-8205-1d7840bf4499",
    name: "Baliakandi",
    districtId: "0600b095-aacc-5eca-81f3-e20b470163f5",
  },
  {
    id: "ba512344-62bf-5332-856f-6fa08bc1ca52",
    name: "Goalandaghat",
    districtId: "0600b095-aacc-5eca-81f3-e20b470163f5",
  },
  {
    id: "fc8488a4-bce8-5ecd-b8db-421e32c9c4de",
    name: "Pangsha",
    districtId: "0600b095-aacc-5eca-81f3-e20b470163f5",
  },
  {
    id: "1a164800-d30b-5d8d-955e-95523496c1a5",
    name: "Kalukhali",
    districtId: "0600b095-aacc-5eca-81f3-e20b470163f5",
  },
  {
    id: "519b34bf-6c6f-5227-acb5-105c54f459b0",
    name: "Rajbari Sadar",
    districtId: "0600b095-aacc-5eca-81f3-e20b470163f5",
  },
  {
    id: "e3aa1465-e5ec-5ae0-b75f-898a6a2d6032",
    name: "Shariatpur Sadar -Palong",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "0f079a81-3eca-57f7-b0bc-0db9694804ab",
    name: "Damudya",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "1b1e29b8-99a3-54a3-b53c-8a6535a62dc5",
    name: "Naria",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "b58f90b1-2116-537a-add1-596cb634e4fd",
    name: "Jajira",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "766ca8eb-bfe8-5228-833f-cd68a97dab0d",
    name: "Bhedarganj",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "980c386d-9f07-58bf-950f-498b01f246dd",
    name: "Gosairhat",
    districtId: "22aaa8c8-2357-5187-bb93-cd7c66f31a53",
  },
  {
    id: "28afa6ab-eef1-59dd-99fb-b78211d8ceb1",
    name: "Jhenaigati",
    districtId: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
  },
  {
    id: "b4dbfbcf-a532-5b14-9616-d8d0b53cfa6e",
    name: "Nakla",
    districtId: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
  },
  {
    id: "536e2d7a-7608-5045-a619-651e57588d52",
    name: "Nalitabari",
    districtId: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
  },
  {
    id: "a88c9b36-c147-5c1c-8a95-d2d533e4f4d1",
    name: "Sherpur Sadar",
    districtId: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
  },
  {
    id: "cde59478-c894-5681-993f-197fe7896ebe",
    name: "Sreebardi",
    districtId: "b1a9e64a-e763-581a-b4b6-ca3870b9d694",
  },
  {
    id: "a88412dc-a1c1-57c3-bd7e-325bd80d7354",
    name: "Tangail Sadar",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "7c8b691f-7974-5227-b618-75fb7cb4bbc4",
    name: "Sakhipur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "af92fd5a-65a2-54d3-b633-ae06599d5ae4",
    name: "Basail",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "d7fbe670-0f92-523c-b4b4-a327d6b678ff",
    name: "Madhupur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "662da5e1-2770-5f3b-8f8e-f0080fbffa81",
    name: "Ghatail",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "dace3a48-5e95-5318-b196-445ad872cce6",
    name: "Kalihati",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "8325c247-c376-526d-a0fe-8eb3a3791279",
    name: "Nagarpur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "3cadf5ff-df9d-5d79-bf77-78d31368d2cd",
    name: "Mirzapur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "13d5f29f-55ae-50a4-86dd-b6cf8696659a",
    name: "Gopalpur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "80ff1087-ad16-5f75-8dc8-4cb9eb36ef4c",
    name: "Delduar",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "95b9242c-853d-58fb-a381-974094249951",
    name: "Bhuapur",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "00c690b7-53c3-5476-86bc-dae946180110",
    name: "Dhanbari",
    districtId: "a4f95830-8b51-5d9e-9d46-0f54aa0556eb",
  },
  {
    id: "28ac4008-7a82-508d-860f-dc0b25793398",
    name: "Bagerhat Sadar",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "b142ca56-8294-5504-a657-d4b7a9fee614",
    name: "Chitalmari",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "096402fe-e737-56e3-b07a-e632c2e4f4c6",
    name: "Fakirhat",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "264aa173-8cfa-521a-8045-f7cd83232a51",
    name: "Kachua",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "8db53ca6-967e-5107-a8bb-7ef992b4c55d",
    name: "Mollahat",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "adefa508-257b-5a19-9ce8-db6e0e7cc59b",
    name: "Mongla",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "1e367c91-5192-584b-ae78-5636d3fa6110",
    name: "Morrelganj",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "d58a36fe-f4de-576c-83ea-8a9b2c6102cb",
    name: "Rampal",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "83da365e-a447-50fe-9309-f88e1996794f",
    name: "Sarankhola",
    districtId: "7861822c-1cd1-58df-85c4-cba21b66356b",
  },
  {
    id: "97196436-62a7-5838-86a7-c30749e754e1",
    name: "Damurhuda",
    districtId: "b0dc78b3-180d-5b58-880d-55a76fd47ee4",
  },
  {
    id: "7d442502-9201-5ef6-8b81-cf3b71a16610",
    name: "Chuadanga-S",
    districtId: "b0dc78b3-180d-5b58-880d-55a76fd47ee4",
  },
  {
    id: "fbea8ba3-8491-5769-8d09-46afc6f8a1f3",
    name: "Jibannagar",
    districtId: "b0dc78b3-180d-5b58-880d-55a76fd47ee4",
  },
  {
    id: "4ed8a56b-1046-5ef6-8dbc-022b34656b8d",
    name: "Alamdanga",
    districtId: "b0dc78b3-180d-5b58-880d-55a76fd47ee4",
  },
  {
    id: "c417e2dd-33bb-5907-be36-680ada2b9b41",
    name: "Abhaynagar",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "c792fe06-e885-598e-9269-ff4a6fe835c8",
    name: "Keshabpur",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "689b744a-75c3-539d-aa86-b4993b1e0784",
    name: "Bagherpara",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "05322f78-e1cc-5889-b7b2-50c4b7479b9e",
    name: "Jessore Sadar",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "839f7d21-5324-5974-8fa9-b4bf7ae60d12",
    name: "Chaugachha",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "d1860679-651c-5524-8c11-ee6097487d89",
    name: "Manirampur",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "e1e636c7-6d43-5b71-b1be-0e0a534d281d",
    name: "Jhikargachha",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "d527fd1f-6d26-5eb5-ad20-670108be9e10",
    name: "Sharsha",
    districtId: "370d46ca-967d-5046-bf64-4bc29013844b",
  },
  {
    id: "94f24926-2e10-51e9-9d9c-a3445a6877f6",
    name: "Jhenaidah Sadar",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "93e8bbeb-9acb-5187-8625-f661b35cbd5e",
    name: "Maheshpur",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "a2d2d1eb-dd3f-5a4b-8d3d-59480b72f610",
    name: "Kaliganj",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "1375e7f1-1dd8-5a0e-ab21-623df0e12bf3",
    name: "Kotchandpur",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "c7fd20e0-2a87-52a4-accb-d3a2db1319f1",
    name: "Shailkupa",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "317eea14-e278-5abc-8882-35b0703f6370",
    name: "Harinakunda",
    districtId: "73d4c7b1-67de-55c5-a3d2-ce1e7906a898",
  },
  {
    id: "8ca0fc1e-fbc5-58cf-b4f0-60eda8738415",
    name: "Terokhada",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "c63dba79-8838-531f-9c69-cf91edbcbbd1",
    name: "Batiaghata",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "cabf18bf-0f10-50f3-8ba3-2dd203d155c7",
    name: "Dacope",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "86d85acc-f952-591c-8c57-0f67df311ea3",
    name: "Dumuria",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "36761816-77fe-5553-9ba2-e6db303d6a37",
    name: "Dighalia",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "ba366374-fde6-5940-bc3e-d59b992a0648",
    name: "Koyra",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "302ef141-3de9-528b-9bcb-c1f86eb0e0e4",
    name: "Paikgachha",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "4d24de4d-7e79-52c7-a6cb-a54bbf58ecf5",
    name: "Phultala",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "f8820bf1-f432-5fcd-9f51-5d1d2ddc3feb",
    name: "Rupsa",
    districtId: "ffc1df8c-d946-5d7a-99da-5bff5f22f87f",
  },
  {
    id: "8a587905-ada4-5c83-bb6d-c285206a39a0",
    name: "Kushtia Sadar",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "787761eb-ce29-5e10-9e1d-eb068b0ecb51",
    name: "Kumarkhali",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "92db73d4-caaa-5e04-849f-3f9da6fde445",
    name: "Daulatpur",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "ca8e5ce8-7c14-5f1a-a17a-eed1afb44922",
    name: "Mirpur",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "419532fa-cd7e-5e31-b491-8fad1504c42a",
    name: "Bheramara",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "15ec40c0-64df-5a90-b887-db64f7a783df",
    name: "Khoksa",
    districtId: "2ac3afbb-645a-51ba-854f-c64a65dc473d",
  },
  {
    id: "f7ffd45f-2173-5217-bf99-f169d3805909",
    name: "Magura Sadar",
    districtId: "219bfd2f-14fd-5929-84c7-3d111d04b2a7",
  },
  {
    id: "d3034971-99b5-52c4-b75b-934ead7793b8",
    name: "Mohammadpur",
    districtId: "219bfd2f-14fd-5929-84c7-3d111d04b2a7",
  },
  {
    id: "8698923a-78f5-5249-b585-3cae6417a179",
    name: "Shalikha",
    districtId: "219bfd2f-14fd-5929-84c7-3d111d04b2a7",
  },
  {
    id: "fb786f57-5f75-518f-ab5c-248d1696ede2",
    name: "Sreepur",
    districtId: "219bfd2f-14fd-5929-84c7-3d111d04b2a7",
  },
  {
    id: "beb3a0ca-497e-502a-bc6f-aee7e6d3d1c7",
    name: "angni",
    districtId: "ec202906-8b74-5f41-a5e6-44f017cc7e65",
  },
  {
    id: "e8f77cb2-cb24-5d40-be49-121463b3b28c",
    name: "Mujib Nagar",
    districtId: "ec202906-8b74-5f41-a5e6-44f017cc7e65",
  },
  {
    id: "872ab57b-cb76-5d61-9d98-0fa3107dc240",
    name: "Meherpur-S",
    districtId: "ec202906-8b74-5f41-a5e6-44f017cc7e65",
  },
  {
    id: "af63a01a-c3c9-54e5-9ce3-f9434858ec34",
    name: "Narail-S Upazilla",
    districtId: "f089aa9e-0c1a-54b5-8081-252b768a3e7f",
  },
  {
    id: "4141670e-76d3-5e12-b1e1-764f0cf8b115",
    name: "Lohagara Upazilla",
    districtId: "f089aa9e-0c1a-54b5-8081-252b768a3e7f",
  },
  {
    id: "3d2439ef-ac1c-5126-b7ce-0d5c76047b44",
    name: "Kalia Upazilla",
    districtId: "f089aa9e-0c1a-54b5-8081-252b768a3e7f",
  },
  {
    id: "11f99821-d0d7-54a0-8738-a7a85e4118f1",
    name: "Satkhira Sadar",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "53dc23e5-e8a6-5843-a6a6-650a1fb8a54e",
    name: "Assasuni",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "5d50fdb2-448c-555e-80b7-336b43787a6d",
    name: "Debhata",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "b0ba422f-953b-5a72-9cd9-11f34c7586d4",
    name: "Tala",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "5f51a147-efa5-5294-b0d9-3624882e550d",
    name: "Kalaroa",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "f3be17aa-a403-5324-bb4d-785c5d4bcbc4",
    name: "Kaliganj",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "9b3f834a-6e0d-5620-be2d-ccb91659f138",
    name: "Shyamnagar",
    districtId: "0d7d5687-ae74-5ea4-93c0-8f539020016a",
  },
  {
    id: "a992b41c-cc81-5d8e-90c1-3ae8cc2fa452",
    name: "Adamdighi",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "e34b9916-4d56-5c3b-8bff-d3b12b7cb317",
    name: "Bogra Sadar",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "8aca46c9-7d9e-50d7-9683-26808488c2fd",
    name: "Sherpur",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "5172cc4e-b015-54a0-bd56-1e560e5d3272",
    name: "Dhunat",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "f77534a2-826e-5b4f-9fd3-428298373772",
    name: "Dhupchanchia",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "b4533bb0-972a-5038-a352-e4db05c3f138",
    name: "Gabtali",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "862a49bb-9c8d-5e3d-9995-5aa4bf8f551e",
    name: "Kahaloo",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "a5ea3594-f154-5a60-83c7-b5262c604d8d",
    name: "Nandigram",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "0ae8603c-aa61-5173-b797-d07b2f634a9a",
    name: "Sahajanpur",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "a7fb3365-a947-5bb9-be78-9970ac3e75b3",
    name: "Sariakandi",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "ce525c8d-1975-5aef-864f-4ed74134be2d",
    name: "Shibganj",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "f9625a61-a50b-5406-a318-b93ec030bf44",
    name: "Sonatala",
    districtId: "731bcb1f-ad1c-5310-aa90-150de85b28fd",
  },
  {
    id: "41cb3441-d842-5a81-9828-b3a5fcb789c7",
    name: "Joypurhat S",
    districtId: "60f402cf-619d-5679-9d0c-421a195a87c4",
  },
  {
    id: "a837c90f-64c8-5448-bfbb-a08db29f3e97",
    name: "Akkelpur",
    districtId: "60f402cf-619d-5679-9d0c-421a195a87c4",
  },
  {
    id: "93669a9f-33e9-543f-9ef3-379b5af4cfa3",
    name: "Kalai",
    districtId: "60f402cf-619d-5679-9d0c-421a195a87c4",
  },
  {
    id: "6b4e18e2-0ce5-54e4-96a5-9e236c0d7867",
    name: "Khetlal",
    districtId: "60f402cf-619d-5679-9d0c-421a195a87c4",
  },
  {
    id: "824db2ba-b022-569d-9c9a-51d76ac03960",
    name: "Panchbibi",
    districtId: "60f402cf-619d-5679-9d0c-421a195a87c4",
  },
  {
    id: "e0a931ec-1e95-5511-bb00-dd12af96cdc2",
    name: "Naogaon Sadar",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "33599a30-4980-53c6-b7ec-31de63ffa2d7",
    name: "Mohadevpur",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "4c61ce1d-445e-5245-9420-e84addc86d11",
    name: "Manda",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "70226f26-7eb1-5878-b09e-f8f3194d931e",
    name: "Niamatpur",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "6e3520b2-7481-5f6e-a772-04beacaa2eca",
    name: "Atrai",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "199f2aee-3f9a-513c-868e-618a3dbfd232",
    name: "Raninagar",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "21dfe1d2-9a09-5a0a-813f-e7ffb071bbd2",
    name: "Patnitala",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "721060c2-a282-502d-9877-3e29e602b219",
    name: "Dhamoirhat",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "9d94321c-a9c8-590a-a2c8-3dbf59c9e73c",
    name: "Sapahar",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "1baeb6c4-e0a8-58c3-8751-1e493885b913",
    name: "Porsha",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "c12fde62-01e8-5284-b610-3a4e74929562",
    name: "Badalgachhi",
    districtId: "f1228862-fb71-5a41-a46c-18f78c032a63",
  },
  {
    id: "3dc3ba58-083f-5b2a-90f4-e8e790b0ba38",
    name: "Natore Sadar",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "f71c77b6-7428-5272-bef4-34686328d804",
    name: "Baraigram",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "f6d44146-86f2-5d03-b9ee-1836d8fb9530",
    name: "Bagatipara",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "1782040f-18e3-5c49-a901-f982fc93095a",
    name: "Lalpur",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "000e3a8b-c56e-5ee1-852e-a0c32ea4e5b5",
    name: "Natore Sadar",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "0eb72cf0-1438-5d0f-b1c5-5165583b11a4",
    name: "Baraigram",
    districtId: "fc1a9371-19f1-5360-a06b-b86d1b7fbf0d",
  },
  {
    id: "35c7c7fb-44ee-547d-8ac9-386e643fb481",
    name: "Bholahat",
    districtId: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
  },
  {
    id: "749c52c3-e56c-560f-b0bb-af61296eec0b",
    name: "Gomastapur",
    districtId: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
  },
  {
    id: "b46084a3-8e0a-5eb0-ba85-2c8598782a3f",
    name: "Nachole",
    districtId: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
  },
  {
    id: "d0fbe5bb-a7b9-51e7-bad8-9409db5a16a4",
    name: "Nawabganj Sadar",
    districtId: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
  },
  {
    id: "c9440999-9cfe-5c82-9443-a8e38c148c18",
    name: "Shibganj",
    districtId: "67f6ad26-41dc-5060-be3a-016308a3c3c0",
  },
  {
    id: "1f56dbf0-9d89-56a3-8511-476aa4610f15",
    name: "Atgharia",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "306d8335-5838-5c5c-a27e-7db4b7eecf24",
    name: "Bera",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "a817b108-c535-5dba-9f38-9d6ce36bbe9c",
    name: "Bhangura",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "a6a5ef50-fe99-57c3-a0ea-661f4e1a1d93",
    name: "Chatmohar",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "61fe5a54-1b5c-54dc-ae0a-748fb4f9168f",
    name: "Faridpur",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "50b7b564-fd09-541b-985d-0367459f8a49",
    name: "Ishwardi",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "25719fb5-6209-59b5-b399-555117c80a6e",
    name: "Pabna Sadar",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "08a62761-b086-57ff-ac4c-f27552349607",
    name: "Santhia",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "c7264c20-1725-5da4-a71a-0d989861eaeb",
    name: "Sujanagar",
    districtId: "f1e06fa2-2a61-5f58-9bb1-04ee1de7a585",
  },
  {
    id: "2908c951-9d98-56b3-b750-f79e58177404",
    name: "Bagha",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "7a71ed21-76ce-5f60-bae7-88ceaafcb2f2",
    name: "Bagmara",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "43fcebce-c915-5148-b12a-f538136802cc",
    name: "Charghat",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "a1b44dea-e87c-5a02-91eb-ca86534ac06f",
    name: "Durgapur",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "8b7da488-e97e-59a4-800c-4760995c994e",
    name: "Godagari",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "016278b7-a514-53e3-8f28-7eba8cf27944",
    name: "Mohanpur",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "9e2948e7-4f3e-575f-a093-22cd7b5a8c45",
    name: "Paba",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "b936b2d7-cf98-5094-a13c-5d69730c205e",
    name: "Puthia",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "f8aa0100-0085-57a6-bfb2-c99bae74bcc9",
    name: "Tanore",
    districtId: "eeaf90e0-5abb-5b28-99fa-cd1623ccb691",
  },
  {
    id: "e94be297-b56a-5127-bfc6-45305339b711",
    name: "Sirajganj Sadar",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "1b7f013f-2fc3-5684-b120-b6bb9896e3d0",
    name: "Belkuchi",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "506fc5ba-7c84-5922-9477-4bec572622ac",
    name: "Chauhali",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "83dbf7ef-ea79-5ca6-81c6-96a2e048d0a9",
    name: "Kamarkhanda",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "c3a85a40-5c7a-5326-964a-45a3534307c5",
    name: "Kazipur",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "32e41400-380d-55ff-9eae-020a2ca3d773",
    name: "Raiganj",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "01682681-23fa-5adc-9106-741c40914c53",
    name: "Shahjadpur",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "87493376-0bdc-5352-a62b-2edde151a180",
    name: "Tarash",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "ac1e0941-9a67-58d9-9cb6-0286fa3fb57b",
    name: "Ullahpara",
    districtId: "584fb1e3-24d7-5192-b701-fc37e65231a8",
  },
  {
    id: "f6564e53-35f3-5e1e-ac50-4fd0d35f03e6",
    name: "Birampur",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "061757a6-c989-5d36-b245-edbffdd9afc5",
    name: "Birganj",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "ac5cb1b1-dbe0-5f33-9336-7051c233ec59",
    name: "Biral",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "5ccdb6c7-fcb7-56d7-b07d-c0b12289ca4d",
    name: "Bochaganj",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "4dcaf2f4-4720-54ae-8b0d-b7f15b91a928",
    name: "Chirirbandar",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "a90be5f7-b99a-58b3-b631-a7a3a43e9071",
    name: "Phulbari",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "10a6fc98-8c12-5a65-b698-357d0fbc6f7e",
    name: "Ghoraghat",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "e65ac058-9dc4-5d13-a34e-b9adf34395b9",
    name: "Hakimpur",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "9d8f7df6-3e9f-5ba0-964a-11de6d7a958f",
    name: "Kaharole",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "3ff16eeb-6541-5162-acd6-1e7a3b6b1e5f",
    name: "Khansama",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "980fa76d-7616-5790-84ce-6a2cb57d5513",
    name: "Dinajpur Sadar",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "bafda029-00dc-54c7-ad9e-38151746dbeb",
    name: "Nawabganj",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "161e2a35-5fba-5c56-8615-2b732a4827ee",
    name: "Parbatipur",
    districtId: "0d2aa299-df12-5cf1-aaf6-d73e838ae778",
  },
  {
    id: "a73e620c-6f36-5051-87db-4d1cc107b21c",
    name: "Fulchhari",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "162017be-7df0-50cc-9820-7a5d2934b9ae",
    name: "Gaibandha sadar",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "f4514095-741f-5952-960a-fed54a59bf2d",
    name: "Gobindaganj",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "9880b877-f965-5849-8737-3aba40e0068d",
    name: "Palashbari",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "58935006-1404-567b-913e-79bd06d8b2bc",
    name: "Sadullapur",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "d2716a08-817c-5a34-ba8c-bfb50abbd1c4",
    name: "Saghata",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "f1b7c6b6-efb6-5342-8218-6d9e13f3f544",
    name: "Sundarganj",
    districtId: "2d37e5b5-6989-5a6d-8832-cbffc5d88e29",
  },
  {
    id: "40bfd850-4041-5bb4-ab89-1abedbd94113",
    name: "Kurigram Sadar",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "9b796945-9b77-588a-9081-2c3542fcdb1a",
    name: "Nageshwari",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "e4a8c3f2-90b7-5834-92ff-83bfb0aca84b",
    name: "Bhurungamari",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "8a378b8e-b8d3-5b20-8710-bef6f54cfcdf",
    name: "Phulbari",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "d51a20cf-a5ac-500f-85b3-df32ebe67ed6",
    name: "Rajarhat",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "32f0316d-7dd0-5609-9739-f760cf8e8271",
    name: "Ulipur",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "d9f6f32f-b5b0-5235-89aa-aaf9d2ff6bd7",
    name: "Chilmari",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "b080aa04-c0ff-55d1-b9da-826dc9471bdb",
    name: "Rowmari",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "c381be99-ebd7-5a5a-a05e-f0624a19f52b",
    name: "Char Rajibpur",
    districtId: "9373462e-3329-5cfb-8f32-4cc180181e36",
  },
  {
    id: "11262cfd-9cca-52fc-a376-fd9bde0df3bd",
    name: "Lalmanirhat Sadar",
    districtId: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
  },
  {
    id: "920e075c-a410-5a0d-a129-94d240ed668b",
    name: "Aditmari",
    districtId: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
  },
  {
    id: "d58d2589-6d52-5af9-8ee8-afd49bedcc71",
    name: "Kaliganj",
    districtId: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
  },
  {
    id: "d6f45c1b-ea1a-54f8-9bd6-762a8ead96e5",
    name: "Hatibandha",
    districtId: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
  },
  {
    id: "7318502e-6594-5769-820e-ea6c141fc542",
    name: "Patgram",
    districtId: "2b102277-b180-5fdc-9dbb-3b74d57a13f7",
  },
  {
    id: "b76fa49e-6a11-58b8-a334-f72dedab270e",
    name: "Nilphamari Sadar",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "b049399c-edb6-5f6a-9a57-7d130c30ee36",
    name: "Saidpur",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "33cf8034-4af0-54d1-b96a-82faaaeea103",
    name: "Jaldhaka",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "cac69bc9-411b-5cb8-9949-9c9c9b3b6ec5",
    name: "Kishoreganj",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "a1b86595-e843-5bae-9833-facd3db1de58",
    name: "Domar",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "ce83d3b5-c6eb-5022-88de-cd2952a474e7",
    name: "Dimla",
    districtId: "0ef22852-6a1f-5eb8-81ee-bc031338432a",
  },
  {
    id: "e3205435-e2e0-5e0d-97e3-e8a9e036e4ee",
    name: "Panchagarh Sadar",
    districtId: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
  },
  {
    id: "ee2fb32b-5cad-5cac-90bf-5d01a3e805c5",
    name: "Debiganj",
    districtId: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
  },
  {
    id: "200e1e37-34a5-5463-882d-6cdc18d48476",
    name: "Boda",
    districtId: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
  },
  {
    id: "3cdf49e1-8735-50e0-887a-744a598c2da5",
    name: "Atwari",
    districtId: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
  },
  {
    id: "d0bb07b6-059b-5d7f-b0da-199bc31ec19b",
    name: "Tetulia",
    districtId: "7a9ff92c-4bcb-508b-a501-19ad23d3c3d3",
  },
  {
    id: "5822dfdc-b335-5f67-96f5-74ad326ae448",
    name: "Badarganj",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "727fc477-28de-5279-b8d0-f4ee461efde1",
    name: "Mithapukur",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "75f683d0-c512-5688-ab13-97887995495e",
    name: "Gangachara",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "293e8f79-e289-5c25-9c75-1b6658c1420c",
    name: "Kaunia",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "239aec17-4110-5c15-8478-312cfcf1e7a9",
    name: "Rangpur Sadar",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "1cef1d31-1b5c-5a76-bb81-d6fc7e0471ac",
    name: "Pirgachha",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "aedfef25-ee76-5924-a304-30c2bbc2d6b5",
    name: "Pirganj",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "4d0c7cd3-0bd4-558f-a707-d2898f390490",
    name: "Taraganj",
    districtId: "51a9e2f7-a23d-54e7-bb25-8bb6170f3c60",
  },
  {
    id: "a214622f-2b76-5d3f-bcb8-ee07b244ae2f",
    name: "Thakurgaon Sadar",
    districtId: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
  },
  {
    id: "e38ff120-0ba7-574c-a6db-40548be556f3",
    name: "Pirganj",
    districtId: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
  },
  {
    id: "6b7d0d03-dc9d-5a0f-8518-87ae861feb75",
    name: "Baliadangi",
    districtId: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
  },
  {
    id: "449db870-586f-5b5f-bd8c-ca1c07ac057c",
    name: "Haripur",
    districtId: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
  },
  {
    id: "91bf4c1b-9063-5639-94e2-8c21e31d1a9c",
    name: "Ranisankail",
    districtId: "bf9fd9b3-d85d-5883-9f82-8f835cc3fbd1",
  },
  {
    id: "137b4619-98f9-5546-b31f-f5988a211877",
    name: "Ajmiriganj",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "5b8db54e-2e8f-5181-b058-5208435daf88",
    name: "Baniachang",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "ffb6bd7d-d863-5db2-aa2f-04dab2207533",
    name: "Bahubal",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "840d7c53-9831-5dcf-9981-1a2e52b5274c",
    name: "Chunarughat",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "07059fde-3a81-50c7-b046-34d2cf0068e4",
    name: "Habiganj Sadar",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "147314ce-b018-59b3-962d-e21733906e9b",
    name: "Lakhai",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "d5ae29cb-381a-560c-ba73-ce08fa859428",
    name: "Madhabpur",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "85528a8d-b50c-530d-95df-97e85564cf87",
    name: "Nabiganj",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "c610e275-6ea4-5eab-add8-57a7c5b7b185",
    name: "Shaistagonj",
    districtId: "0b4b49dc-b61b-559a-babc-1069eb28f6b9",
  },
  {
    id: "2fc201f3-471b-58a6-96fe-5e66733a549b",
    name: "Moulvibazar Sadar",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "319dd246-d647-5037-93c2-861b5bf1c7e5",
    name: "Barlekha",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "38c6f597-7ec3-5b83-b810-46306f3b911a",
    name: "Juri",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "615247c6-5d09-537c-9824-4a9c8c9e6fd8",
    name: "Kamalganj",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "4e7b1a63-9b04-5fa7-a204-4215dadc0645",
    name: "Kulaura",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "bf4b5477-afd1-5736-a700-3518ea1b057b",
    name: "Rajnagar",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "c99e5afb-61a4-5e7b-9583-c3d7a6d1463b",
    name: "Sreemangal",
    districtId: "7594b365-13d2-5ed3-bcaf-a67d532e3e5c",
  },
  {
    id: "ce577649-8f9e-5038-81ec-1cee63ebc101",
    name: "Bishwamvarpur",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "cfe10f3a-b71e-52f7-8920-bdb8d9cfb7bd",
    name: "Chhatak",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "86eb9ccb-f3c2-5e9e-b3c6-9f07585267a3",
    name: "Derai",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "67e2cf7e-598f-5875-ae17-c26adea48003",
    name: "Dharampasha",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "61a88047-b5d0-530f-8a3e-3b5c411d3e4d",
    name: "Dowarabazar",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "2df6aac2-5809-5800-b8f8-65e607fdc398",
    name: "Jagannathpur",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "57801096-b178-5837-bab9-4e0b6498b976",
    name: "Jamalganj",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "f9ec81c5-6a0a-5b01-9c66-6842d32ebf42",
    name: "Sulla",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "8d61eb4f-cec9-542c-9c31-96c5f26c28b1",
    name: "Sunamganj Sadar",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "1046e8f1-2a45-5662-989e-124aab25a73a",
    name: "Shanthiganj",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "ea00a915-1a4b-5529-999e-9619bea18738",
    name: "Tahirpur",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "782304ed-267c-5148-b42b-b8e6951ca6d8",
    name: "Sylhet Sadar",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "a247210a-696a-5369-b8ba-f57f1ea37b21",
    name: "Beanibazar",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "82f8177d-7e73-58b6-9f4e-c24fe4093a67",
    name: "Bishwanath",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "a39de580-3bf7-533e-99e3-fb82a57d2cc8",
    name: "Dakshin Surma",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "cfae26a8-c1e3-580c-a39a-40ddcdc63948",
    name: "Balaganj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "f1ff5cb3-3a6e-5be4-8cf3-40d4a1135f18",
    name: "Companiganj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "9e1a8ace-3cb0-54ca-82c2-d1baefa9c136",
    name: "Fenchuganj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "ccf56793-1f48-507d-bee8-114c17a45e97",
    name: "Golapganj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "921cc640-8aa9-52ac-8ff9-bf1512e5a887",
    name: "Gowainghat",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "38ec3749-6491-5a6f-ad53-cde7873089f5",
    name: "Jointapur",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "ff6f6bee-2780-55a1-9e27-f3535fe63d1f",
    name: "Kanaighat",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "71b4d518-ec54-5e2a-aea3-365d830b5b7c",
    name: "Zakiganj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "6bcbccaa-1dd5-554d-a09f-e61f48d4d913",
    name: "Nobigonj",
    districtId: "2ffc742c-711f-51a1-87a6-918f9cf918c0",
  },
  {
    id: "763c965d-ad79-5412-903b-5aa1afb66666",
    name: "Eidgaon",
    districtId: "47a84cb4-85f7-5aa8-a510-de92ffbbf11c",
  },
  {
    id: "799018ec-e215-506c-9224-f59a54a6b7e1",
    name: "Modhyanagar",
    districtId: "cb412320-bc2b-55fd-ad1f-1194c2420f8c",
  },
  {
    id: "b6dbf840-5bc8-577a-a614-2fab5fe3797e",
    name: "Dasar",
    districtId: "ed13f145-6c25-5865-8184-a4d321e14c2f",
  },
];

async function main(silent = false): Promise<void> {
  const log = (msg: string) => {
    if (!silent) console.log(msg);
  };

  // ── Already-seeded check ──────────────────────────────────────────────────
  // Count existing divisions. If all 8 are present, the DB is fully seeded —
  // skip every upsert and return immediately.
  const existingDivisionCount = await prisma.division.count({
    where: { isDeleted: false },
  });

  if (existingDivisionCount >= divisions.length) {
    log("⏭️  Geo data already seeded — skipping.");
    return;
  }

  // ── Partial-seed warning ──────────────────────────────────────────────────
  // Some divisions exist but not all — run upserts to fill the gaps.
  if (existingDivisionCount > 0) {
    log(
      `⚠️  Partial seed detected (${existingDivisionCount}/${divisions.length} divisions found). Filling missing records...`,
    );
  } else {
    log("🌱 Seeding geo data for the first time...\n");
  }

  // ── Divisions ─────────────────────────────────────────────────────────────
  log("📍 Seeding divisions...");
  let divInserted = 0;
  let divSkipped = 0;

  for (const division of divisions) {
    const existing = await prisma.division.findUnique({
      where: { id: division.id },
    });

    if (existing) {
      divSkipped++;
    } else {
      await prisma.division.create({ data: division });
      divInserted++;
    }
  }

  log(`   ✓ ${divInserted} inserted, ${divSkipped} already existed`);

  // ── Districts ─────────────────────────────────────────────────────────────
  log("\n🗺  Seeding districts...");
  let distInserted = 0;
  let distSkipped = 0;

  for (const district of districts) {
    const existing = await prisma.district.findUnique({
      where: { id: district.id },
    });

    if (existing) {
      distSkipped++;
    } else {
      await prisma.district.create({ data: district });
      distInserted++;
    }
  }

  log(`   ✓ ${distInserted} inserted, ${distSkipped} already existed`);

  // ── Upazilas ──────────────────────────────────────────────────────────────
  log("\n🏘  Seeding upazilas...");
  let upazInserted = 0;
  let upazSkipped = 0;

  for (const upazila of upazilas) {
    const existing = await prisma.upazila.findUnique({
      where: { id: upazila.id },
    });

    if (existing) {
      upazSkipped++;
    } else {
      await prisma.upazila.create({ data: upazila });
      upazInserted++;
    }
  }

  log(`   ✓ ${upazInserted} inserted, ${upazSkipped} already existed`);

  // ── Summary ───────────────────────────────────────────────────────────────
  log("\n✅ Geo seeding complete!");
}

// -- Named export (supports: import { seedGeoData } from '../prisma/seed') ----
// TypeScript handles this correctly with ts-node/tsx regardless of
// "type": "commonjs" in package.json.
export { main as seedGeoData };

// -- Standalone execution (npx prisma db seed / npm run seed) ----------------
// require.main === module is true only when this file is run directly,
// not when imported by server.ts — so seeding never runs twice.
if (require.main === module) {
  main(false)
    .catch((e) => {
      console.error("Seeder failed:", e.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
