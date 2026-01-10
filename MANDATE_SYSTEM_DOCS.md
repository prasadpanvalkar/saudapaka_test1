# Mandate System & API Documentation

## Overview
The Mandate System allows Sellers and Brokers to create formal agreements (Mandates) for property deals. It supports digital signatures, exclusivity tracking, and automated notifications.

## 1. Workflows

### A. Broker Hiring (Seller -> Broker)
1.  **Initiation**: Seller logs in, selects a Property, and searches for a Broker by mobile number.
2.  **Request**: Seller sends a mandate request (Status: `PENDING`).
    *   *Notification*: Broker receives "New Mandate Request".
3.  **Action**:
    *   **Accept**: Broker reviews terms and digitally signs. (Status: `ACTIVE`) -> Seller notified.
    *   **Reject**: Broker provides a reason. (Status: `REJECTED`) -> Seller notified.

### B. Pitching a Client (Broker -> Seller)
1.  **Initiation**: Broker logs in and views a Property listing directly.
2.  **Request**: Broker initiates a mandate for that property. The system automatically detects the Seller (Property Owner).
    *   *Notification*: Seller receives "New Mandate Request".
3.  **Action**:
    *   **Accept**: Seller reviews and signs. (Status: `ACTIVE`) -> Broker notified.
    *   **Reject**: Seller rejects. (Status: `REJECTED`) -> Broker notified.

### C. Platform Deal (Seller -> SaudaPakka)
1.  **Initiation**: Seller selects "Deal with SaudaPakka" option.
2.  **Request**: System notifies Admins. (Status: `PENDING`).
3.  **Action**: Admin logs in, reviews, and signs on behalf of the platform. (Status: `ACTIVE`) -> Seller notified.

---

## 2. API Reference (For Frontend Team)

### Base URL: `/api/mandates/`

### 1. Initiate Mandate (`POST /api/mandates/`)

**Scenario A: Seller hires Broker**
```json
{
  "property_item": 123,           // ID of the property
  "initiated_by": "SELLER",
  "deal_type": "WITH_BROKER",
  "broker": 456,                  // ID of the broker (get this from Search API)
  "is_exclusive": true,
  "commission_rate": 2.0          // Optional
}
```

**Scenario B: Broker pitches for Property**
```json
{
  "property_item": 123,           // ID of the property (System auto-detects seller)
  "initiated_by": "BROKER",
  "deal_type": "WITH_BROKER",
  "commission_rate": 1.5
}
```

**Scenario C: Seller with Platform**
```json
{
  "property_item": 123,
  "initiated_by": "SELLER",
  "deal_type": "WITH_PLATFORM",
  "is_exclusive": true
}
```

**Response (201 Created)**:
```json
{
  "id": 55,
  "status": "PENDING",
  "expiry_date": "2026-04-10",
  ...
}
```

---

### 2. Search Broker (`GET /api/mandates/search_broker/`)
Used by Seller to find a broker before initiating a mandate.
*   **Query Param**: `mobile_number`
*   **Example**: `/api/mandates/search_broker/?mobile_number=9876543210`
*   **Response**: Returns ID and Name of broker if found & active.

---

### 3. Accept & Sign (`POST /api/mandates/{id}/accept_and_sign/`)
The recipient (who did NOT initiate) calls this to activate the mandate.
*   **Content-Type**: `multipart/form-data`
*   **Body**:
    *   `signature`: (File) The image file of the user's signature.

---

### 4. Reject Mandate (`POST /api/mandates/{id}/reject/`)
*   **Body**:
    ```json
    {
      "reason": "Commission rate is too low."
    }
    ```

---

### 5. Cancel Mandate (`POST /api/mandates/{id}/cancel_mandate/`)
Terminates an ACTIVE mandate immediately.
*   **Body**: `{}` (Empty JSON)

---

### 6. Renew Mandate (`POST /api/mandates/{id}/renew_mandate/`)
Creates a new `PENDING` mandate linked to the old expired one.
*   **Body**: `{}` (Empty JSON)
*   **Response**: Returns the NEW mandate object.

---

## 3. Frontend Integration Guidelines

1.  **Exclusivity Error Handling**:
    *   If you get a `400 Bad Request` with message *"This property already has an active or pending mandate..."*, display a clear error to the user: "Property is already under contract or negotiation."

2.  **Notifications**:
    *   Poll `GET /api/notifications/` or check on page load.
    *   If `is_read` is `false`, show a red dot.
    *   Clicking a notification should use `action_url` to navigate (e.g., to the Mandate Details page).
    *   Call `POST /api/notifications/{id}/mark_as_read/` when the user views it.

3.  **Signatures**:
    *   Use a canvas pad or file upload for signatures.
    *   Signatures are required ONLY for the receiving party (the one Accepting). The Initiator is assumed to consent by creating the request (though you can add an optional signature field during creation if UI demands it).

4.  **Role Logic**:
    *   If `user.is_active_broker` is true -> Show options to initiate mandates on Properties they view.
    *   If `user.is_active_seller` is true -> Show "My Mandates" dashboard with "Hire Broker" button.

---

## 4. Detailed User Discovery & Initiation Logic

### How Users Find Each Other

1.  **Seller finding a Broker**:
    *   **UI**: Seller enters a mobile number in a search box.
    *   **API**: Call `GET /api/mandates/search_broker/?mobile_number=...`
    *   **Result**: If `200 OK`, show the Broker's Name. Use the `id` from the response in the Initiate Mandate payload.

2.  **Broker finding a Seller**:
    *   **UI**: Broker browses the "All Properties" list.
    *   **API**: No search needed. The Broker clicks "Propose Mandate" on a Property.
    *   **Payload**: Send `property_item: <property_id>` and `initiated_by: "BROKER"`. The backend **automatically** links it to the Property Owner (Seller).

3.  **Seller finding the Platform**:
    *   **UI**: Seller selects "Partner with SaudaPakka" option.
    *   **API**: Send `deal_type: "WITH_PLATFORM"`.
    *   **Payload**: Do **NOT** send a `broker` ID. The system routes this to Admins.

---

## 5. Notification Center Integration

**Endpoint**: `/api/notifications/`

**1. Fetching Notifications**
*   **Request**: `GET /api/notifications/`
*   **Response**:
    ```json
    [
      {
        "id": 101,
        "title": "New Mandate Request",
        "message": "John Doe has initiated a mandate...",
        "action_url": "/mandates/55",
        "is_read": false,
        "created_at": "2026-01-10T10:00:00Z"
      }
    ]
    ```

**2. Handling Clicks**
1.  User clicks the notification item.
2.  Frontend calls `POST /api/notifications/101/mark_as_read/`.
3.  Frontend negotiates to `action_url` (e.g., `/mandates/55`).

---

## 6. Mandate Status Lifecycle

*   **PENDING**: Created, waiting for the partner to Accept/Sign.
*   **ACTIVE**: Both parties have agreed (Signed). Time starts ticking (90 days).
*   **REJECTED**: Partner declined the request.
*   **TERMINATED_BY_USER**: Cancelled manually by Seller/Broker.
*   **EXPIRED**: 90 days passed without renewal.

> **Note**: A Property CANNOT have a new Mandate initiated if it currently has a **PENDING** or **ACTIVE** mandate.
